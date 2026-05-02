# AWS Deployment

This guide walks you through deploying Arcgentic to **Amazon EKS** with a fully automated CI/CD pipeline powered by GitHub Actions. The stack uses ECR for container images, Secrets Manager for runtime secrets, and an ALB for HTTPS ingress.

## Deployment Architecture

```mermaid
graph TD
    subgraph "GitHub"
        GH["GitHub Actions"]
    end

    subgraph "AWS Cloud"
        ECR["ECR (Container Registry)"]
        SM["Secrets Manager"]

        subgraph "EKS Cluster"
            subgraph "arcgentic namespace"
                Web["web (Nginx + React SPA)"]
                US["user-service (Go/GraphQL)"]
                AS["agent-service (Python/Flask)"]
                MIG["user-service-migrate (Job)"]
            end

            subgraph "kube-system"
                ALBC["AWS Load Balancer Controller"]
            end

            subgraph "external-secrets"
                ESO["External Secrets Operator"]
            end
        end

        ALB["Application Load Balancer"]
        RDS["RDS PostgreSQL"]
        ACM["ACM Certificate"]
    end

    DNS["DNS (Route 53 / External)"]
    User["End User"]

    GH -->|push images| ECR
    GH -->|kubectl apply| Web
    GH -->|kubectl apply| US
    GH -->|kubectl apply| AS
    GH -->|run job| MIG
    ESO -->|sync| SM
    ALBC -->|provisions| ALB
    ALB -->|HTTPS| Web
    Web -->|proxy /api| AS
    Web -->|proxy /query| US
    US --> RDS
    AS --> RDS
    MIG --> RDS
    ACM -.->|TLS cert| ALB
    DNS -->|CNAME / Alias| ALB
    User -->|https://your-domain| ALB
```

## Prerequisites

Before deploying, you need the following AWS resources provisioned:

| Resource | Purpose |
|---|---|
| **EKS Cluster** | Kubernetes control plane and managed node group |
| **RDS PostgreSQL** | Persistent database in the same VPC as EKS |
| **ACM Certificate** | TLS certificate for your app domain |
| **Secrets Manager** | Runtime secrets for `user-service` and `agent-service` |
| **IAM OIDC Provider** | GitHub Actions federation for keyless deploys |
| **AWS Load Balancer Controller** | Provisions ALB from Kubernetes Ingress resources |
| **External Secrets Operator** | Syncs Secrets Manager → Kubernetes Secrets |

> [!TIP]
> You can set up all of these through the AWS Console or CLI. See the detailed walkthrough in [`deployment/aws-guide/README.md`](https://github.com/smithg09/arcgentic/blob/main/deployment/aws-guide/README.md) for step-by-step instructions for both approaches.

## Quick Start

### 1. Create the EKS Cluster

```bash
export AWS_REGION=ap-south-1
export CLUSTER_NAME=arcgentic-prod

eksctl create cluster \
  --name "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --version 1.35 \
  --with-oidc \
  --managed \
  --nodegroup-name general \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 5
```

### 2. Install Cluster Add-ons

Two Kubernetes controllers must be installed **before** the first deployment:

#### AWS Load Balancer Controller

Creates ALBs from `Ingress` resources.

```bash
# Create IAM policy
curl -fsSL -o iam_policy.json \
  https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Create IRSA service account
eksctl create iamserviceaccount \
  --cluster "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AWSLoadBalancerControllerIAMPolicy" \
  --approve

# Install via Helm
helm repo add eks https://aws.github.io/eks-charts && helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName="$CLUSTER_NAME" \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

#### External Secrets Operator

Syncs AWS Secrets Manager into Kubernetes Secrets.

```bash
helm repo add external-secrets https://charts.external-secrets.io && helm repo update

helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --set installCRDs=true
```

> [!IMPORTANT]
> The External Secrets Operator service account needs an IAM role with `secretsmanager:GetSecretValue` and `secretsmanager:DescribeSecret` permissions scoped to `arcgentic/prod/*`. See the full IAM setup in the detailed guide.

### 3. Create Secrets in AWS Secrets Manager

**`arcgentic/prod/user-service`**:
```json
{
  "POSTGRES_URI": "postgresql://USER:PASSWORD@RDS_ENDPOINT:5432",
  "POSTGRES_DATABASE": "arcgentic",
  "MIGRATE_DATABASE_URL": "postgres://USER:PASSWORD@RDS_ENDPOINT:5432/arcgentic?sslmode=require"
}
```

**`arcgentic/prod/agent-service`**:
```json
{
  "DATABASE_URL": "postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/arcgentic",
  "OPENAI_API_KEY": "",
  "ANTHROPIC_API_KEY": "",
  "GOOGLE_API_KEY": "",
  "OPENROUTER_API_KEY": "",
  "OPENAI_MODEL": "gpt-4o-mini",
  "ANTHROPIC_MODEL": "claude-sonnet-4-20250514",
  "GEMINI_MODEL": "gemini-2.5-flash",
  "OPENROUTER_MODEL": "openai/gpt-4o-mini"
}
```

> [!NOTE]
> At least one LLM provider API key must be set for the agent service to serve model-backed requests.

### 4. Request an ACM Certificate

```bash
aws acm request-certificate \
  --region "$AWS_REGION" \
  --domain-name "your-domain.com" \
  --validation-method DNS
```

Complete DNS validation, then note the certificate ARN.

### 5. Configure GitHub Repository

Create a **production** environment in your GitHub repo settings, then add:

**Secret:**

| Name | Value |
|---|---|
| `AWS_ROLE_TO_ASSUME` | `arn:aws:iam::<account-id>:role/ArcgenticGitHubDeployRole` |

**Variables:**

| Name | Example |
|---|---|
| `AWS_REGION` | `ap-south-1` |
| `EKS_CLUSTER_NAME` | `arcgentic-prod` |
| `APP_HOST` | `app.yourdomain.com` |
| `ACM_CERTIFICATE_ARN` | `arn:aws:acm:ap-south-1:...:certificate/...` |

### 6. Deploy

Go to **Actions → Deploy to Amazon EKS → Run workflow**, or push to your deployment branch.

## CI/CD Pipeline

The GitHub Actions workflow (`deploy-eks.yml`) runs in five sequential stages:

```mermaid
graph LR
    A["1. Detect Changes"] --> B["2. Build Images"]
    B --> C["3. Setup Cluster"]
    C --> D["4. Run Migrations"]
    D --> E["5. Deploy Apps"]

    style A fill:#3b82f6,color:#fff
    style B fill:#8b5cf6,color:#fff
    style C fill:#06b6d4,color:#fff
    style D fill:#f59e0b,color:#fff
    style E fill:#10b981,color:#fff
```

| Stage | What it does |
|---|---|
| **Detect Changes** | Uses Turbo's dry run to identify which apps changed since the last commit. Only changed apps are rebuilt. |
| **Build Images** | Builds Docker images for changed apps, pushes to ECR with both `sha` and `latest` tags. Uses GitHub Actions cache for layer reuse. |
| **Setup Cluster** | Applies Kubernetes manifests: namespace, ConfigMaps, service accounts, secret stores, external secrets, and services. Waits for secrets to sync. |
| **Run Migrations** | Runs the `user-service-migrate` Job if `user-service` changed. Deletes any prior job, applies a fresh one, and waits for completion. |
| **Deploy Apps** | Rolls out updated Deployments for changed apps, applies the Ingress manifest, and waits for rollout to complete. |

> [!TIP]
> Use the **Force rebuild** checkbox when triggering manually to rebuild and deploy all services regardless of changes.

## Kubernetes Resources

All manifests live in `deployment/k8s/`:

```
deployment/k8s/
├── namespace.yaml                    # arcgentic namespace
├── configmap.yaml                    # Non-secret config for user-service and web
├── serviceaccounts.yaml              # K8s service accounts with IRSA annotations
├── secret-store.yaml                 # ClusterSecretStore pointing to Secrets Manager
├── external-secrets.yaml             # ExternalSecret definitions for each service
├── services.yaml                     # ClusterIP services for internal routing
├── user-service-deployment.yaml      # User service (Go) - 2 replicas
├── agent-service-deployment.yaml     # Agent service (Python) - 2 replicas
├── web-deployment.yaml               # Web frontend (Nginx) - 2 replicas
├── user-service-migration-job.yaml   # One-shot migration Job
└── ingress.yaml                      # ALB Ingress with TLS termination
```

### Traffic Flow

```mermaid
graph LR
    Internet["Internet"] -->|HTTPS :443| ALB["ALB"]
    ALB -->|:8080| Web["web (Nginx)"]
    Web -->|/api/*| Agent["agent-service :5001"]
    Web -->|/query/*| User["user-service :8080"]
    Web -->|"/*"| SPA["React SPA (static)"]
```

The `web` container runs Nginx which serves the React SPA and proxies API paths to backend services using Kubernetes-internal DNS.

## DNS Configuration

After the first successful deployment, the ALB Ingress Controller creates an ALB. You need to point your domain to it:

```bash
# Get the ALB hostname
kubectl -n arcgentic get ingress web \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Then create a DNS record:

| Provider | Record Type | Name | Value |
|---|---|---|---|
| **Route 53** | A (Alias) | `app.yourdomain.com` | → ALB |
| **Other DNS** | CNAME | `app.yourdomain.com` | → ALB DNS hostname |

> [!IMPORTANT]
> The ALB won't appear until:
> 1. The AWS Load Balancer Controller is running in the cluster
> 2. The Ingress resource has been applied (happens in the deploy stage)
> 3. Subnets are tagged with `kubernetes.io/role/elb = 1` (public) and `kubernetes.io/cluster/<cluster-name> = shared`

## Updating Secrets

When you update secrets in AWS Secrets Manager, the External Secrets Operator refreshes the Kubernetes Secret automatically. However, pods only read env vars at startup, so you must restart deployments:

```bash
# Update a secret
aws secretsmanager update-secret \
  --region ap-south-1 \
  --secret-id arcgentic/prod/agent-service \
  --secret-string file://updated-secret.json

# Wait for ESO to sync (usually < 1 minute), then restart
kubectl -n arcgentic rollout restart deployment/agent-service
```

## Verification

After deployment, verify everything is healthy:

```bash
# Check pods
kubectl -n arcgentic get pods

# Check external secrets synced
kubectl -n arcgentic get externalsecrets

# Check ingress and ALB address
kubectl -n arcgentic get ingress web

# Check logs
kubectl -n arcgentic logs deployment/user-service
kubectl -n arcgentic logs deployment/agent-service
kubectl -n arcgentic logs deployment/web

# Test endpoints (after DNS is configured)
curl -I https://your-domain.com/healthz
curl https://your-domain.com/api/health
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| **Pod fails with `runAsNonRoot` error** | Dockerfile uses a named `USER` instead of numeric UID | Change `USER username` to `USER 1001` in the Dockerfile |
| **Pod fails with `permission denied`** | `WORKDIR` is set to `/root/` which UID 1001 can't access | Change `WORKDIR` to `/app` |
| **Ingress exists but no ALB created** | AWS Load Balancer Controller not installed, or subnets not tagged | Install the controller and verify subnet tags |
| **ExternalSecret not ready** | IAM role trust policy `sub` doesn't match the service account | Check the OIDC trust policy `sub` field |
| **Pods can't connect to RDS** | RDS security group doesn't allow inbound from EKS nodes | Add inbound rule for port `5432` from the EKS node/pod security group |
| **GitHub Action builds but can't deploy** | EKS Access Entry missing for the deploy role | Create an access entry with `AmazonEKSClusterAdminPolicy` |
| **App loads but `/api` or `/query` returns 502** | Backend pods not ready, or `web-config` ConfigMap has wrong URLs | Check pod readiness and verify ConfigMap service URLs |
| **Migration job fails** | `MIGRATE_DATABASE_URL` secret not set or RDS not reachable | Check the secret value and RDS security group |