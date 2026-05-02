# Local Kubernetes Testing with Minikube

Test the full EKS deployment pipeline locally — same K8s manifests, same Docker images, no AWS account needed.

## What You're Testing

| Production (EKS)                  | Local (Minikube)                         |
| --------------------------------- | ---------------------------------------- |
| ECR image registry                | Minikube's built-in Docker daemon        |
| AWS Secrets Manager → ExternalSecret | Plain Kubernetes Secrets (manual)     |
| ALB Ingress Controller            | Nginx Ingress Controller                 |
| ACM certificate (HTTPS)           | HTTP only (port-forward or NodePort)     |
| RDS PostgreSQL                    | PostgreSQL pod inside Minikube           |
| GitHub Actions builds images      | You build images locally                 |

---

## Prerequisites

### 1. Install Minikube

```bash
brew install minikube
```

### 2. Install kubectl

```bash
brew install kubectl
```

### 3. Start Minikube

Start with enough resources for all services:

```bash
minikube start \
  --cpus 4 \
  --memory 8192 \
  --driver docker
```

### 4. Enable the Ingress addon

```bash
minikube addons enable ingress
```

### 5. Point your shell to Minikube's Docker daemon

This is the key trick — images you build go directly into Minikube, no registry push needed:

```bash
eval $(minikube docker-env)
```

> [!IMPORTANT]
> Run this in **every new terminal session** before building images. If you forget, Minikube won't see your images and pods will get `ErrImagePull`.

---

## Step 1 — Build Docker Images Locally

From the project root, with the Minikube Docker env active:

```bash
# Web (Nginx + Vite static build)
docker build -t arcgentic-web:local -f apps/web/Dockerfile .

# User Service (Go)
docker build -t arcgentic-user-service:local -f apps/user_service/Dockerfile apps/user_service

# User Service Migration
docker build -t arcgentic-user-service-migrate:local -f apps/user_service/Dockerfile.migrate apps/user_service

# Agent Service (Python/Flask)
docker build -t arcgentic-agent-service:local -f apps/agent_service/Dockerfile apps/agent_service
```

> [!TIP]
> Re-run only the image(s) you changed. The full set takes a few minutes the first time.

---

## Step 2 — Create the Local K8s Manifests

The production manifests use `__PLACEHOLDER__` tokens and ExternalSecrets tied to AWS. For local testing, we create a self-contained overlay.

### 2.1 — Create the deploy/local directory structure

The manifests below should already exist alongside this README. If not, create them as shown.

### 2.2 — Namespace (reuse production)

```bash
kubectl apply -f deploy/k8s/namespace.yaml
```

### 2.3 — Deploy PostgreSQL inside Minikube

Create `deploy/local/postgres.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: arcgentic
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: arcgentic
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: postgres
  template:
    metadata:
      labels:
        app.kubernetes.io/name: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: aiproject
            - name: POSTGRES_PASSWORD
              value: aiproject
            - name: POSTGRES_DB
              value: aiproject
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "aiproject"]
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: pgdata
          persistentVolumeClaim:
            claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: arcgentic
spec:
  selector:
    app.kubernetes.io/name: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

Apply it:

```bash
kubectl apply -f deploy/local/postgres.yaml
kubectl -n arcgentic wait --for=condition=available deployment/postgres --timeout=120s
```

### 2.4 — Create Kubernetes Secrets (replaces ExternalSecrets / AWS Secrets Manager)

Create `deploy/local/secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: user-service-env
  namespace: arcgentic
type: Opaque
stringData:
  POSTGRES_URI: "postgresql://aiproject:aiproject@postgres:5432"
  POSTGRES_DATABASE: "aiproject"
  MIGRATE_DATABASE_URL: "postgres://aiproject:aiproject@postgres:5432/aiproject?sslmode=disable"
---
apiVersion: v1
kind: Secret
metadata:
  name: agent-service-env
  namespace: arcgentic
type: Opaque
stringData:
  DATABASE_URL: "postgresql://aiproject:aiproject@postgres:5432/aiproject"
  OPENAI_API_KEY: "${OPENAI_API_KEY}"       # Replace or set via envsubst
  ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}"
  GOOGLE_API_KEY: "${GOOGLE_API_KEY}"
  OPENROUTER_API_KEY: "${OPENROUTER_API_KEY}"
  OPENAI_MODEL: "gpt-4.1-nano"
  ANTHROPIC_MODEL: "claude-sonnet-4-20250514"
  GEMINI_MODEL: "gemini-2.5-flash"
  OPENROUTER_MODEL: "openai/gpt-4o-mini"
```

> [!IMPORTANT]
> **You must fill in at least one real API key** for the agent service to handle LLM requests. Either edit the file directly or use `envsubst`:
>
> ```bash
> export OPENAI_API_KEY="sk-..."
> export ANTHROPIC_API_KEY=""
> export GOOGLE_API_KEY=""
> export OPENROUTER_API_KEY=""
> envsubst < deploy/local/secrets.yaml | kubectl apply -f -
> ```

If editing directly, just replace the `${...}` placeholders and apply:

```bash
kubectl apply -f deploy/local/secrets.yaml
```

### 2.5 — ConfigMap (reuse production)

```bash
kubectl apply -f deploy/k8s/configmap.yaml
```

### 2.6 — ServiceAccounts (reuse production)

```bash
kubectl apply -f deploy/k8s/serviceaccounts.yaml
```

### 2.7 — Services (reuse production)

```bash
kubectl apply -f deploy/k8s/services.yaml
```

---

## Step 3 — Run Database Migrations

Create a local version of the migration job, or just run the job with local image:

```bash
kubectl -n arcgentic delete job user-service-migrate --ignore-not-found

cat <<'EOF' | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: user-service-migrate
  namespace: arcgentic
spec:
  backoffLimit: 2
  ttlSecondsAfterFinished: 300
  template:
    metadata:
      labels:
        app.kubernetes.io/name: user-service-migrate
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: arcgentic-user-service-migrate:local
          imagePullPolicy: Never
          env:
            - name: MIGRATE_DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: user-service-env
                  key: MIGRATE_DATABASE_URL
          command: ["/bin/sh", "-c"]
          args:
            - migrate -path /migrations -database "$MIGRATE_DATABASE_URL" up
EOF

kubectl -n arcgentic wait job/user-service-migrate --for=condition=Complete --timeout=120s
```

Check migration logs:

```bash
kubectl -n arcgentic logs job/user-service-migrate
```

---

## Step 4 — Deploy Application Services

Create `deploy/local/deployments.yaml` — these mirror the production manifests but use local image tags and `imagePullPolicy: Never`:

```yaml
# --- User Service ---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: arcgentic
  labels:
    app.kubernetes.io/name: user-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: user-service
  template:
    metadata:
      labels:
        app.kubernetes.io/name: user-service
    spec:
      serviceAccountName: user-service
      containers:
        - name: user-service
          image: arcgentic-user-service:local
          imagePullPolicy: Never
          ports:
            - name: http
              containerPort: 8080
          envFrom:
            - configMapRef:
                name: user-service-config
            - secretRef:
                name: user-service-env
          env:
            - name: POSTGRES_IS_SSL_DISABLED
              value: "true"
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
---
# --- Agent Service ---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-service
  namespace: arcgentic
  labels:
    app.kubernetes.io/name: agent-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: agent-service
  template:
    metadata:
      labels:
        app.kubernetes.io/name: agent-service
    spec:
      serviceAccountName: agent-service
      containers:
        - name: agent-service
          image: arcgentic-agent-service:local
          imagePullPolicy: Never
          ports:
            - name: http
              containerPort: 5001
          envFrom:
            - secretRef:
                name: agent-service-env
          readinessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 20
            periodSeconds: 20
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
---
# --- Web (Nginx) ---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: arcgentic
  labels:
    app.kubernetes.io/name: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: web
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web
    spec:
      serviceAccountName: web
      containers:
        - name: web
          image: arcgentic-web:local
          imagePullPolicy: Never
          ports:
            - name: http
              containerPort: 8080
          envFrom:
            - configMapRef:
                name: web-config
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 250m
              memory: 256Mi
```

Apply deployments and wait for rollout:

```bash
kubectl apply -f deploy/local/deployments.yaml

kubectl -n arcgentic rollout status deployment/user-service --timeout=120s
kubectl -n arcgentic rollout status deployment/agent-service --timeout=120s
kubectl -n arcgentic rollout status deployment/web --timeout=120s
```

---

## Step 5 — Create Local Ingress

Create `deploy/local/ingress.yaml` — uses nginx ingress instead of ALB:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
  namespace: arcgentic
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: arcgentic.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  name: http
```

```bash
kubectl apply -f deploy/local/ingress.yaml
```

---

## Step 6 — Access the Application

### Option A: `minikube tunnel` (recommended)

```bash
# In a separate terminal:
minikube tunnel
```

Then add to `/etc/hosts`:

```
127.0.0.1 arcgentic.local
```

Open **http://arcgentic.local** in your browser.

### Option B: Port-forward (simpler, no ingress needed)

```bash
kubectl -n arcgentic port-forward svc/web 5173:80
```

Open **http://localhost:5173** in your browser.

### Option C: minikube service

```bash
minikube -n arcgentic service web --url
```

---

## Verification Checklist

Run these to confirm everything is healthy:

```bash
# All pods running?
kubectl -n arcgentic get pods

# Services resolving?
kubectl -n arcgentic get svc

# Secrets created?
kubectl -n arcgentic get secrets

# Ingress assigned?
kubectl -n arcgentic get ingress

# Health checks passing?
kubectl -n arcgentic exec deploy/web -- curl -s http://localhost:8080/healthz
kubectl -n arcgentic exec deploy/user-service -- wget -qO- http://localhost:8080/healthz
kubectl -n arcgentic exec deploy/agent-service -- curl -s http://localhost:5001/api/health

# Logs for each service
kubectl -n arcgentic logs deploy/web --tail=20
kubectl -n arcgentic logs deploy/user-service --tail=20
kubectl -n arcgentic logs deploy/agent-service --tail=20
```

---

## Quick Reference: Full Deploy from Scratch

Copy-paste one-shot (after prerequisites are installed):

```bash
# 1. Start Minikube
minikube start --cpus 4 --memory 8192 --driver docker
minikube addons enable ingress
eval $(minikube docker-env)

# 2. Build images
docker build -t arcgentic-web:local -f apps/web/Dockerfile .
docker build -t arcgentic-user-service:local -f apps/user_service/Dockerfile apps/user_service
docker build -t arcgentic-user-service-migrate:local -f apps/user_service/Dockerfile.migrate apps/user_service
docker build -t arcgentic-agent-service:local -f apps/agent_service/Dockerfile apps/agent_service

# 3. Apply base resources
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/local/postgres.yaml
kubectl -n arcgentic wait --for=condition=available deployment/postgres --timeout=120s
kubectl apply -f deploy/local/secrets.yaml
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/serviceaccounts.yaml
kubectl apply -f deploy/k8s/services.yaml

# 4. Run migrations
kubectl -n arcgentic delete job user-service-migrate --ignore-not-found
kubectl apply -f deploy/local/migration-job.yaml
kubectl -n arcgentic wait job/user-service-migrate --for=condition=Complete --timeout=120s

# 5. Deploy apps
kubectl apply -f deploy/local/deployments.yaml
kubectl -n arcgentic rollout status deployment/user-service --timeout=120s
kubectl -n arcgentic rollout status deployment/agent-service --timeout=120s
kubectl -n arcgentic rollout status deployment/web --timeout=120s

# 6. Access
kubectl -n arcgentic port-forward svc/web 5173:80
```

---

## Rebuilding After Code Changes

```bash
# Make sure you're using Minikube's Docker
eval $(minikube docker-env)

# Rebuild the changed image (e.g., web)
docker build -t arcgentic-web:local -f apps/web/Dockerfile .

# Restart the deployment to pick up the new image
kubectl -n arcgentic rollout restart deployment/web
kubectl -n arcgentic rollout status deployment/web --timeout=120s
```

---

## Cleanup

```bash
# Delete all arcgentic resources
kubectl delete namespace arcgentic

# Stop Minikube (preserves state)
minikube stop

# Full nuke (deletes the VM)
minikube delete
```

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `ErrImagePull` / `ImagePullBackOff` | You forgot `eval $(minikube docker-env)` before building, or `imagePullPolicy` is not `Never` |
| Pod `CrashLoopBackOff` | Check logs: `kubectl -n arcgentic logs <pod-name> --previous` |
| Migration job fails | Check postgres is ready: `kubectl -n arcgentic get pods -l app.kubernetes.io/name=postgres` |
| `connection refused` on port-forward | The container's health check is failing — check readiness probe and logs |
| Ingress returns 404 | Verify ingress addon is enabled: `minikube addons list \| grep ingress` |
| Minikube is slow | Increase resources: `minikube stop && minikube start --cpus 6 --memory 12288` |
| Agent service won't start | Ensure at least one API key is set in `deploy/local/secrets.yaml` |

---

## What This Does NOT Test

These remain AWS-specific and can only be validated in a real EKS environment:

- **ExternalSecrets Operator** syncing from AWS Secrets Manager
- **ALB Ingress Controller** with ACM certificate and HTTPS
- **ECR** image push/pull
- **GitHub Actions OIDC** role assumption
- **IAM Roles for Service Accounts (IRSA)**
- **RDS** connectivity from within VPC

Everything else — the Docker images, Kubernetes deployments, services, config propagation, health checks, inter-service networking, and migration jobs — is fully validated locally.
