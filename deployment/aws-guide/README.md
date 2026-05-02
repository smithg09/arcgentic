# Arcgentic AWS Deployment

This setup builds four Docker images in GitHub Actions, pushes them to Amazon ECR, syncs runtime secrets from AWS Secrets Manager into EKS, runs database migrations, and rolls out the three apps to Amazon EKS.

## Architecture

- `web`: Vite static app served by unprivileged Nginx. Browser calls `/api` and `/query`; Nginx proxies those paths inside the cluster.
- `user_service`: Go GraphQL API on port `8080`.
- `agent_service`: Flask API on port `5001`, served by Gunicorn.
- `user-service-migrate`: one-shot migration image for `apps/user_service/db/migration`.
- Database: use Amazon RDS for PostgreSQL in the same VPC as EKS.
- Secrets: AWS Secrets Manager -> External Secrets Operator -> Kubernetes Secret -> `envFrom` in Deployments.

## 1. Create AWS Infrastructure

Set your account values locally:

```bash
export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
export CLUSTER_NAME=arcgentic-prod
export APP_HOST=app.example.com
```

Create an EKS cluster. As of May 1, 2026, EKS `1.35`, `1.34`, and `1.33` are in standard support; this example uses `1.35`.

```bash
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

Create an RDS PostgreSQL database in the EKS VPC. Minimum production shape:

- private subnets only
- storage encryption enabled
- deletion protection enabled
- security group allows PostgreSQL `5432` from the EKS worker node or pod security group
- database name: `arcgentic`, or update the secret values below

Request or import an ACM certificate in the same region as the ALB:

```bash
aws acm request-certificate \
  --region "$AWS_REGION" \
  --domain-name "$APP_HOST" \
  --validation-method DNS
```

After DNS validation completes, save the certificate ARN for GitHub Actions.

## 2. Install Cluster Add-ons

Install the AWS Load Balancer Controller so the Kubernetes `Ingress` creates an internet-facing ALB:

```bash
curl -fsSL -o iam_policy.json \
  https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

eksctl create iamserviceaccount \
  --cluster "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn "arn:aws:iam::$AWS_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy" \
  --approve

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName="$CLUSTER_NAME" \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

Install External Secrets Operator with permission to read only this app's Secrets Manager path:

```bash
cat > external-secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:arcgentic/prod/*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name ArcgenticExternalSecretsPolicy \
  --policy-document file://external-secrets-policy.json

eksctl create iamserviceaccount \
  --cluster "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --namespace external-secrets \
  --name external-secrets \
  --role-name ArcgenticExternalSecretsRole \
  --attach-policy-arn "arn:aws:iam::$AWS_ACCOUNT_ID:policy/ArcgenticExternalSecretsPolicy" \
  --approve \
  --override-existing-serviceaccounts

helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --set installCRDs=true \
  --set serviceAccount.create=false \
  --set serviceAccount.name=external-secrets
```

## 3. Create AWS Secrets

`user_service` expects `POSTGRES_URI` without the database path, then appends `POSTGRES_DATABASE`. The migration job expects a complete `postgres://.../db?sslmode=require` URL.

```bash
aws secretsmanager create-secret \
  --region "$AWS_REGION" \
  --name arcgentic/prod/user-service \
  --secret-string '{
    "POSTGRES_URI": "postgresql://DB_USER:DB_PASSWORD@RDS_ENDPOINT:5432",
    "POSTGRES_DATABASE": "arcgentic",
    "MIGRATE_DATABASE_URL": "postgres://DB_USER:DB_PASSWORD@RDS_ENDPOINT:5432/arcgentic?sslmode=require"
  }'
```

The agent service must have `DATABASE_URL` and at least one provider key. Keep unused provider keys as empty strings so the ExternalSecret can sync every configured property.

```bash
aws secretsmanager create-secret \
  --region "$AWS_REGION" \
  --name arcgentic/prod/agent-service \
  --secret-string '{
    "DATABASE_URL": "postgresql://DB_USER:DB_PASSWORD@RDS_ENDPOINT:5432/arcgentic",
    "OPENAI_API_KEY": "",
    "ANTHROPIC_API_KEY": "",
    "GOOGLE_API_KEY": "",
    "OPENROUTER_API_KEY": "",
    "OPENAI_MODEL": "gpt-4o-mini",
    "ANTHROPIC_MODEL": "claude-sonnet-4-20250514",
    "GEMINI_MODEL": "gemini-2.5-flash",
    "OPENROUTER_MODEL": "openai/gpt-4o-mini"
  }'
```

To update later:

```bash
aws secretsmanager update-secret \
  --region "$AWS_REGION" \
  --secret-id arcgentic/prod/agent-service \
  --secret-string file://agent-service-secret.json
```

External Secrets Operator refreshes the Kubernetes Secret, but pods only read environment variables at startup. Restart deployments after secret changes:

```bash
kubectl -n arcgentic rollout restart deployment/user-service deployment/agent-service
```

## 4. Create GitHub OIDC Deploy Role

Create an IAM role trusted by your GitHub repository. Replace `OWNER` and `REPO`.

```bash
cat > github-actions-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:environment:production"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name ArcgenticGitHubDeployRole \
  --assume-role-policy-document file://github-actions-trust-policy.json
```

Attach permissions for ECR and EKS discovery:

```bash
cat > github-actions-deploy-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "eks:DescribeCluster",
      "Resource": "arn:aws:eks:${AWS_REGION}:${AWS_ACCOUNT_ID}:cluster/${CLUSTER_NAME}"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ArcgenticGitHubDeployRole \
  --policy-name ArcgenticGitHubDeployPolicy \
  --policy-document file://github-actions-deploy-policy.json
```

Allow that IAM role to administer this EKS cluster through Kubernetes:

```bash
export GITHUB_ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/ArcgenticGitHubDeployRole"

aws eks create-access-entry \
  --cluster-name "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --principal-arn "$GITHUB_ROLE_ARN" \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --principal-arn "$GITHUB_ROLE_ARN" \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

## 5. Configure GitHub

In GitHub repository settings:

Secrets:

- `AWS_ROLE_TO_ASSUME`: `arn:aws:iam::<account-id>:role/ArcgenticGitHubDeployRole`

Actions variables:

- `AWS_REGION`: for example `ap-south-1`
- `EKS_CLUSTER_NAME`: for example `arcgentic-prod`
- `APP_HOST`: for example `app.example.com`
- `ACM_CERTIFICATE_ARN`: validated ACM certificate ARN

Push to `main` or run the `Deploy to Amazon EKS` workflow manually.

## 6. Verify

```bash
kubectl -n arcgentic get pods
kubectl -n arcgentic get externalsecrets
kubectl -n arcgentic get ingress web
kubectl -n arcgentic logs deployment/user-service
kubectl -n arcgentic logs deployment/agent-service
```

After the ALB address appears, create a DNS record:

- `APP_HOST` CNAME -> ALB DNS name, or
- Route 53 alias A record -> ALB

## 7. AWS Console Walkthrough

Use this section if you want to set up the same deployment mostly through the AWS UI. A few commands remain for Helm/Kubernetes installation because the AWS console does not install every third-party Kubernetes controller for you. Run those commands from AWS CloudShell so credentials, region, and network access are already inside AWS.

### 7.1 Pick Region and Naming

In the AWS console region picker, select the region you will use for everything, for example `ap-south-1`.

Use the same names throughout:

- EKS cluster: `arcgentic-prod`
- Kubernetes namespace: `arcgentic`
- App domain: `app.example.com`
- Secrets Manager names: `arcgentic/prod/user-service` and `arcgentic/prod/agent-service`
- GitHub deploy role: `ArcgenticGitHubDeployRole`

### 7.2 Create or Confirm the VPC

Open **VPC > Your VPCs**.

For production, use a VPC with:

- at least two Availability Zones
- public subnets for load balancers
- private subnets for EKS nodes and RDS
- NAT gateway or equivalent egress for private nodes to pull images and reach AWS APIs

If you are creating a new VPC in the UI:

1. Choose **Create VPC**.
2. Choose **VPC and more**.
3. Name it `arcgentic-prod`.
4. Select at least `2` Availability Zones.
5. Choose `2` public subnets and `2` private subnets.
6. Enable DNS hostnames and DNS resolution.
7. Choose **Create VPC**.

Tag subnets so the AWS Load Balancer Controller can discover them:

- Public subnets:
  - `kubernetes.io/cluster/arcgentic-prod = shared`
  - `kubernetes.io/role/elb = 1`
- Private subnets:
  - `kubernetes.io/cluster/arcgentic-prod = shared`
  - `kubernetes.io/role/internal-elb = 1`

### 7.3 Create IAM Roles for EKS

Create the EKS cluster role:

1. Open **IAM > Roles > Create role**.
2. Trusted entity type: **AWS service**.
3. Service or use case: **EKS**.
4. Use case: **EKS - Cluster**.
5. Attach `AmazonEKSClusterPolicy`.
6. Name: `ArcgenticEKSClusterRole`.
7. Choose **Create role**.

Create the managed node group role:

1. Open **IAM > Roles > Create role**.
2. Trusted entity type: **AWS service**.
3. Service or use case: **EC2**.
4. Attach:
   - `AmazonEKSWorkerNodePolicy`
   - `AmazonEKS_CNI_Policy`
   - `AmazonEC2ContainerRegistryReadOnly`
5. Name: `ArcgenticEKSNodeRole`.
6. Choose **Create role**.

### 7.4 Create the EKS Cluster in the UI

Open **Amazon EKS > Clusters > Create cluster**.

1. Choose **Custom configuration**.
2. Turn **EKS Auto Mode** off if you want the managed-node setup used by this guide.
3. Cluster name: `arcgentic-prod`.
4. Kubernetes version: choose the newest standard-support version available to you. As of May 1, 2026, AWS lists `1.35`, `1.34`, and `1.33` in standard support.
5. Cluster IAM role: `ArcgenticEKSClusterRole`.
6. Secrets encryption: optional but recommended; choose a KMS key if your account has one.
7. Networking:
   - VPC: select the VPC from step 7.2.
   - Subnets: select the private subnets and public subnets.
   - Security group: create or select a cluster security group.
   - Cluster endpoint access: choose public and private while setting up; tighten later if needed.
8. Add-ons: keep default add-ons enabled, including VPC CNI, CoreDNS, and kube-proxy.
9. Review and choose **Create**.

Wait until the cluster status is **Active**.

Create a managed node group:

1. Open the cluster.
2. Choose the **Compute** tab.
3. Choose **Add node group**.
4. Name: `general`.
5. Node IAM role: `ArcgenticEKSNodeRole`.
6. Subnets: choose private subnets.
7. Instance type: start with `t3.medium`.
8. Scaling:
   - desired: `2`
   - min: `2`
   - max: `5`
9. Choose **Create** and wait until the node group is **Active**.

### 7.5 Connect CloudShell to the Cluster

Open **CloudShell** from the AWS console top navigation.

Run:

```bash
export AWS_REGION=ap-south-1
export CLUSTER_NAME=arcgentic-prod

aws eks update-kubeconfig \
  --name "$CLUSTER_NAME" \
  --region "$AWS_REGION"

kubectl get nodes
```

You should see the managed nodes as `Ready`.

### 7.6 Create RDS PostgreSQL in the UI

Open **RDS > Databases > Create database**.

1. Choose **Standard create**.
2. Engine: **PostgreSQL**.
3. Template: **Production** for real prod, or **Dev/Test** for a cheaper first deployment.
4. DB instance identifier: `arcgentic-prod`.
5. Master username/password: choose values and store them securely.
6. Instance class: start small, for example `db.t4g.micro` or `db.t4g.small` for non-production; choose larger for real traffic.
7. Storage: enable storage autoscaling.
8. Connectivity:
   - VPC: same VPC as EKS.
   - Public access: **No**.
   - VPC security group: create `arcgentic-rds`.
   - Initial database name: `arcgentic`.
9. Authentication: password authentication is enough for this guide.
10. Backups: enable automated backups for production.
11. Encryption: enable storage encryption.
12. Choose **Create database**.

After RDS is available:

1. Open **EC2 > Security Groups**.
2. Select the RDS security group.
3. Add an inbound rule:
   - Type: PostgreSQL
   - Port: `5432`
   - Source: the EKS node security group, or the EKS cluster/pod security group if you use security groups for pods.
4. Save rules.

Copy the RDS endpoint. You will use it in Secrets Manager.

### 7.7 Create ACM Certificate in the UI

Open **AWS Certificate Manager > Request**.

1. Choose **Request a public certificate**.
2. Fully qualified domain name: `app.example.com`.
3. Validation method: **DNS validation**.
4. Choose **Request**.
5. Open the certificate and copy the DNS validation CNAME.
6. Add the CNAME in Route 53 or your DNS provider.
7. Wait until certificate status is **Issued**.
8. Copy the certificate ARN.

The certificate must be in the same AWS region as the ALB/EKS deployment.

### 7.8 Create Runtime Secrets in Secrets Manager UI

Open **Secrets Manager > Store a new secret**.

Create `arcgentic/prod/user-service`:

1. Secret type: **Other type of secret**.
2. Use key/value pairs or plaintext JSON.
3. Use these keys:

```json
{
  "POSTGRES_URI": "postgresql://DB_USER:DB_PASSWORD@RDS_ENDPOINT:5432",
  "POSTGRES_DATABASE": "arcgentic",
  "MIGRATE_DATABASE_URL": "postgres://DB_USER:DB_PASSWORD@RDS_ENDPOINT:5432/arcgentic?sslmode=require"
}
```

4. Secret name: `arcgentic/prod/user-service`.
5. Rotation: disabled for the first deployment; enable later once you have tested rotation and pod restarts.
6. Choose **Store**.

Create `arcgentic/prod/agent-service`:

1. Secret type: **Other type of secret**.
2. Use this JSON. At least one provider API key must be real for the agent to serve model-backed requests:

```json
{
  "DATABASE_URL": "postgresql://DB_USER:DB_PASSWORD@RDS_ENDPOINT:5432/arcgentic",
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

3. Secret name: `arcgentic/prod/agent-service`.
4. Choose **Store**.

### 7.9 Install AWS Load Balancer Controller

The UI creates the EKS cluster, but the ALB `Ingress` in this repo needs the AWS Load Balancer Controller inside Kubernetes.

First create the IAM policy in the UI:

1. Open the official policy JSON: `https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json`.
2. Open **IAM > Policies > Create policy**.
3. Choose **JSON**.
4. Paste the policy JSON.
5. Name: `AWSLoadBalancerControllerIAMPolicy`.
6. Choose **Create policy**.

Create the controller IAM role:

1. In CloudShell, get the cluster OIDC issuer:

```bash
aws eks describe-cluster \
  --name "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --query "cluster.identity.oidc.issuer" \
  --output text
```

2. Open **IAM > Identity providers**. If the provider for that issuer is not present, choose **Add provider**:
   - Provider type: OpenID Connect
   - Provider URL: the issuer URL from the command
   - Audience: `sts.amazonaws.com`
3. Open **IAM > Roles > Create role**.
4. Trusted entity type: **Web identity**.
5. Identity provider: the EKS OIDC provider.
6. Audience: `sts.amazonaws.com`.
7. Attach `AWSLoadBalancerControllerIAMPolicy`.
8. Name: `AmazonEKSLoadBalancerControllerRole`.
9. After creating the role, open **Trust relationships > Edit trust policy**.
10. Ensure the condition limits access to the controller service account:

```json
{
  "StringEquals": {
    "OIDC_PROVIDER_WITHOUT_HTTPS:aud": "sts.amazonaws.com",
    "OIDC_PROVIDER_WITHOUT_HTTPS:sub": "system:serviceaccount:kube-system:aws-load-balancer-controller"
  }
}
```

Replace `OIDC_PROVIDER_WITHOUT_HTTPS` with the cluster OIDC issuer without `https://`.

Install the controller from CloudShell:

```bash
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
export ALB_CONTROLLER_ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/AmazonEKSLoadBalancerControllerRole"

helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName="$CLUSTER_NAME" \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="$ALB_CONTROLLER_ROLE_ARN"
```

Verify:

```bash
kubectl -n kube-system rollout status deployment/aws-load-balancer-controller
```

### 7.10 Install External Secrets Operator

Create the IAM policy in the UI:

1. Open **IAM > Policies > Create policy > JSON**.
2. Paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:AWS_REGION:AWS_ACCOUNT_ID:secret:arcgentic/prod/*"
    }
  ]
}
```

3. Replace `AWS_REGION` and `AWS_ACCOUNT_ID`.
4. Name: `ArcgenticExternalSecretsPolicy`.
5. Choose **Create policy**.

Create the IAM role:

1. Open **IAM > Roles > Create role**.
2. Trusted entity type: **Web identity**.
3. Identity provider: the EKS cluster OIDC provider.
4. Audience: `sts.amazonaws.com`.
5. Attach `ArcgenticExternalSecretsPolicy`.
6. Name: `ArcgenticExternalSecretsRole`.
7. Edit the trust policy so the `sub` is:

```text
system:serviceaccount:external-secrets:external-secrets
```

Install the operator from CloudShell:

```bash
export EXTERNAL_SECRETS_ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/ArcgenticExternalSecretsRole"

helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --set installCRDs=true \
  --set serviceAccount.create=true \
  --set serviceAccount.name=external-secrets \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="$EXTERNAL_SECRETS_ROLE_ARN"
```

Verify:

```bash
kubectl -n external-secrets rollout status deployment/external-secrets
```

### 7.11 Create GitHub Actions OIDC Role in AWS UI

If GitHub's OIDC identity provider does not exist:

1. Open **IAM > Identity providers > Add provider**.
2. Provider type: **OpenID Connect**.
3. Provider URL: `https://token.actions.githubusercontent.com`.
4. Audience: `sts.amazonaws.com`.
5. Choose **Add provider**.

Create the GitHub deploy policy:

1. Open **IAM > Policies > Create policy > JSON**.
2. Paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "eks:DescribeCluster",
      "Resource": "arn:aws:eks:AWS_REGION:AWS_ACCOUNT_ID:cluster/arcgentic-prod"
    }
  ]
}
```

3. Replace `AWS_REGION` and `AWS_ACCOUNT_ID`.
4. Name: `ArcgenticGitHubDeployPolicy`.
5. Choose **Create policy**.

Create the GitHub deploy role:

1. Open **IAM > Roles > Create role**.
2. Trusted entity type: **Web identity**.
3. Identity provider: `token.actions.githubusercontent.com`.
4. Audience: `sts.amazonaws.com`.
5. Attach `ArcgenticGitHubDeployPolicy`.
6. Name: `ArcgenticGitHubDeployRole`.
7. Open the role and choose **Trust relationships > Edit trust policy**.
8. Use this trust policy, replacing `AWS_ACCOUNT_ID`, `OWNER`, and `REPO`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:environment:production"
        }
      }
    }
  ]
}
```

### 7.12 Give the GitHub Role EKS Cluster Access in the UI

Open **Amazon EKS > Clusters > arcgentic-prod > Access**.

If the authentication mode does not include EKS API:

1. Choose **Manage access**.
2. Select a mode with the EKS API, such as **API and ConfigMap**.
3. Save and wait for the cluster to return to **Active**.

Create the access entry:

1. Choose **Create access entry**.
2. IAM principal: `ArcgenticGitHubDeployRole`.
3. Type: **Standard**.
4. Continue to access policies.
5. Add policy: `AmazonEKSClusterAdminPolicy`.
6. Access scope: **Cluster**.
7. Choose **Create**.

This allows the GitHub Action to run `kubectl apply`, migrations, and rollout checks.

### 7.13 Configure GitHub Repository UI

Open your GitHub repo.

Create the production environment:

1. **Settings > Environments > New environment**.
2. Name: `production`.
3. Add required reviewers if you want manual approval before deployment.

Add repository or environment secret:

- `AWS_ROLE_TO_ASSUME = arn:aws:iam::<account-id>:role/ArcgenticGitHubDeployRole`

Add repository or environment variables:

- `AWS_REGION = ap-south-1`
- `EKS_CLUSTER_NAME = arcgentic-prod`
- `APP_HOST = app.example.com`
- `ACM_CERTIFICATE_ARN = <issued ACM certificate ARN>`

### 7.14 Run the Deployment

Open **GitHub > Actions > Deploy to Amazon EKS**.

1. Choose **Run workflow**, or push to `main`.
2. Watch the steps:
   - configure AWS credentials with OIDC
   - create ECR repositories if missing
   - build and push Docker images
   - apply Kubernetes base resources
   - wait for External Secrets to sync
   - run migrations
   - roll out deployments

### 7.15 Verify in AWS UI

In **Amazon EKS > Clusters > arcgentic-prod > Resources**, check:

- Namespace: `arcgentic`
- Deployments:
  - `web`
  - `user-service`
  - `agent-service`
- Pods are running and ready.
- Services exist for all three apps.
- Ingress `web` exists.

In **EC2 > Load Balancers**:

1. Find the ALB created by Kubernetes.
2. Check that target groups are healthy.
3. Copy the ALB DNS name.

In **Route 53** or your DNS provider:

1. Create `app.example.com`.
2. If Route 53, use an Alias A record to the ALB.
3. If external DNS, use a CNAME to the ALB DNS name.

Test:

```bash
curl -I https://app.example.com/healthz
curl https://app.example.com/api/health
```

### 7.16 Common UI Setup Failures

- ExternalSecret is not ready: check the `ArcgenticExternalSecretsRole` trust policy `sub`, the service account annotation, and the secret names.
- Ingress does not create an ALB: check AWS Load Balancer Controller pod logs and subnet tags.
- Pods cannot connect to RDS: check RDS security group inbound `5432` from the EKS node or pod security group.
- GitHub Action can build but cannot deploy: check the EKS Access Entry for `ArcgenticGitHubDeployRole`.
- App loads but `/api` or `/query` fails: check `web-config` service URLs and backend pod readiness.

## References

- AWS EKS cluster creation: https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html
- AWS EKS access entries: https://docs.aws.amazon.com/eks/latest/userguide/creating-access-entries.html
- AWS Secrets Manager secret creation: https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html
- AWS RDS DB creation: https://docs.aws.amazon.com/AmazonRDS/latest/gettingstartedguide/creating.html
- AWS IAM OIDC providers: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html
- GitHub OIDC with AWS: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- AWS credentials action OIDC notes: https://github.com/aws-actions/configure-aws-credentials
