#!/usr/bin/env bash

sudo sysctl fs.inotify.max_user_watches=524288
sudo sysctl fs.inotify.max_user_instances=512

#kind delete clusters firewall-test || true
#kind create cluster --config kind-cluster-config.yaml --name firewall-test || true


kubectl apply -f ../deploy/firewallrule-crd.yaml
kubectl apply -f ../deploy/firewall-operator-rbac.yaml
kubectl apply -f ../deploy/firewall-operator-daemonset.yaml