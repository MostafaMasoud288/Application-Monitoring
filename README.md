# 🚀 Kubernetes GitOps & Observability Pipeline

An end-to-end GitOps and monitoring architecture deployed on a local Kubernetes (`kind`) cluster. This project demonstrates how to automate application delivery, manage infrastructure declaratively, and implement proactive monitoring and alerting using the Prometheus stack.

---

## 🏗️ Architecture Overview (ASCII Flow)

Below is a high-level representation of the infrastructure and data flow:

```text
[ Developer (Mostafa) ]
          | (1. Push Code)
          v
+-----------------------+        (2. Build & Push)       +-------------------+
|   GitHub Repository   | -----------------------------> |    Docker Hub     |
| (Code & K8s Manifests)|                                | (Image Registry)  |
+-----------------------+                                +-------------------+
          |                                                       |
          | (3. Pull Manifests/Helm Values)                       | (4. Pull Image)
          v                                                       v
+=============================================================================+
|                      Local Kubernetes Cluster (kind)                        |
|                                                                             |
|  +-----------------+           [ Deploys ]           +-------------------+  |
|  |     ArgoCD      | ------------------------------> |   App Namespace   |  |
|  | (GitOps Engine) |                                 |  (Node.js Pods)   |  |
|  +-----------------+                                 +-------------------+  |
|          |                                                  |    ^          |
|          |                     [ Deploys ]                  |    |          |
|          +-------------------------------------------+      |    | (Scrapes)|
|                                                      v      v    |          |
|  +-----------------------------------------------------------------------+  |
|  |                         Monitoring Namespace                          |  |
|  |                                                                       |  |
|  |  +-------------------+      +-------------------+      +-----------+  |  |
|  |  | Prometheus Server | ---> |   Alertmanager    | ---> |  Grafana  |  |  |
|  |  +-------------------+      +-------------------+      +-----------+  |  |
|  |                                      |                                |  |
|  +--------------------------------------|--------------------------------+  |
|                                         | (Reads Webhook URL)               |
|                              [ Kubernetes Secret ]                          |
+=============================================================================+
                                          |

```
🛠️ Tech Stack & Tools
Orchestration: Kubernetes (kind on local Linux VM)

CI/CD & GitOps: GitHub Actions, ArgoCD, Git

Containerization: Docker, Docker Hub

Observability: Prometheus Operator, Grafana, Alertmanager, PromQL

Package Management: Helm

Alerting Integration: Slack API (Webhooks)

⚙️ Project Pipeline & Execution Steps
This project was built and executed in four main phases:

Phase 1: Continuous Integration (CI)
Created a Node.js application exposing a /metrics endpoint.

Configured GitHub Actions to trigger on every push to the main branch.

The pipeline builds the Docker image, tags it, pushes it to Docker Hub, and updates the Kubernetes deployment manifests with the new image tag.

Phase 2: GitOps & Continuous Deployment (CD)
Provisioned a local Kubernetes cluster using kind (Kubernetes IN Docker) to simulate a real-world environment.

Installed ArgoCD inside the cluster to act as the GitOps controller.

Configured ArgoCD Application resources to track the GitHub repository and automatically sync the Node.js application to the cluster.

Phase 3: Infrastructure Monitoring (Observability)
Used ArgoCD to deploy the kube-prometheus-stack via Helm, passing custom values.yaml directly from the Git repository.

Created a ServiceMonitor custom resource to dynamically guide the Prometheus Operator to discover and scrape metrics from the Node.js application pods.

Phase 4: Proactive Alerting & Security
Defined custom PrometheusRules (e.g., absent(up) to detect if zero pods are running).

Secured the Slack Webhook URL by creating a manual Kubernetes Secret inside the cluster (avoiding plain-text secrets in GitHub to pass Push Protection).

Configured Alertmanager to read the secret and route formatted alerts (Critical/Resolved) directly to a dedicated Slack channel whenever the application goes down.

💡 Key Highlights & Learnings
Security First: Handled sensitive data (Slack Webhooks) securely using Kubernetes Secrets rather than exposing them in source code.

Declarative Infrastructure: Everything from the application deployments to the monitoring stack configurations is managed declaratively via Git.

Reliability: Built a system that not only deploys automatically but also proactively notifies administrators of potential downtime before users are impacted.

Developed by [Mostafa Masoud]
                                          | (5. Fires Alert)
                                          v
                               [ 💬 Slack Workspace ]
