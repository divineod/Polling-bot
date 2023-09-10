#* Include environment variables if .env exists
ifneq ("$(wildcard .env)","")
	include .env
	export
endif


.PHONY: up
up:
	npm start
