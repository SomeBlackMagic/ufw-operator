kustomize-apply:
	kustomize build resources/ | kubectl apply -f -

kustomize-delete:
	kustomize build resources/ | kubectl delete -f -

generate-entity-from-crd:
	crd-client-generator-js resources/bases/prometheus-alerting-middleware.io_severityremapers.yaml src/Domain/Entity/prometheus-alerting-middleware.io_severityremapers.generated.ts


build:
	docker build -f .docker/image.Dockerfile . -t ghcr.io/someblackmagic/ufw-operator:master
	docker push ghcr.io/someblackmagic/ufw-operator:master