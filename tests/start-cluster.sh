#!/usr/bin/env bash

sudo sysctl fs.inotify.max_user_watches=524288
sudo sysctl fs.inotify.max_user_instances=512

#kind delete clusters firewall-test || true
#kind create cluster --config kind-cluster-config.yaml --name firewall-test || true

docker run -d -p 5000:5000 --name kind-registry registry:2

kubectl cluster-info --context kind-firewall-test
kubectl get nodes
kubectl apply -f ../deploy/firewallrule-crd.yaml
kubectl apply -f ../deploy/firewall-operator-rbac.yaml
kubectl apply -f ../deploy/firewall-operator-daemonset.yaml