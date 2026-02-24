.PHONY: run check

run:
	python3 -m http.server 4173

check:
	test -f README.md
	test -f docs/overview.md
	test -f docs/architecture.md
	test -f USE_CASE.md
	test -f VALUE.md
	test -f INNOVATION_STATUS.md
	@echo "Standardisation docs: OK"
