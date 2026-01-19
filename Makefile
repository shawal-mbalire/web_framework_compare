# Social Architecture Audit - Makefile
# Convenient commands for Docker Compose deployment

.PHONY: help up down logs ps restart rebuild clean test db-init db-reset

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)Social Architecture Audit - Docker Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)URLs:$(NC)"
	@echo "  Flask:     http://flask.localhost"
	@echo "  Astro:     http://astro.localhost"
	@echo "  TanStack:  http://tanstack.localhost"
	@echo "  Angular:   http://angular.localhost"
	@echo "  Traefik:   http://localhost:8080"

up: ## Start all services
	@echo "$(GREEN)Starting all services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services started!$(NC)"
	@make ps

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

logs: ## View logs from all services
	docker-compose logs -f

logs-flask: ## View Flask logs
	docker-compose logs -f flask

logs-astro: ## View Astro logs
	docker-compose logs -f astro

logs-tanstack: ## View TanStack logs
	docker-compose logs -f tanstack

logs-angular: ## View Angular logs
	docker-compose logs -f angular

logs-db: ## View database logs
	docker-compose logs -f postgres

ps: ## Show service status
	@docker-compose ps

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

restart-flask: ## Restart Flask only
	docker-compose restart flask

restart-astro: ## Restart Astro only
	docker-compose restart astro

restart-tanstack: ## Restart TanStack only
	docker-compose restart tanstack

restart-angular: ## Restart Angular only
	docker-compose restart angular

rebuild: ## Rebuild all images and restart
	@echo "$(YELLOW)Rebuilding all images...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)✓ Rebuild complete$(NC)"

rebuild-flask: ## Rebuild Flask image only
	docker-compose up -d --build flask

rebuild-astro: ## Rebuild Astro image only
	docker-compose up -d --build astro

rebuild-tanstack: ## Rebuild TanStack image only
	docker-compose up -d --build tanstack

rebuild-angular: ## Rebuild Angular image only
	docker-compose up -d --build angular

clean: ## Stop services and remove volumes (CAUTION: deletes data!)
	@echo "$(YELLOW)⚠️  This will delete all data. Are you sure? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	docker-compose down -v
	@echo "$(GREEN)✓ Cleaned up$(NC)"

db-shell: ## Connect to PostgreSQL shell
	docker-compose exec postgres psql -U social_user -d social_audit

db-init: ## Initialize database schema
	@echo "$(GREEN)Initializing database...$(NC)"
	docker-compose exec -T postgres psql -U social_user -d social_audit < schema.sql
	@echo "$(GREEN)✓ Database initialized$(NC)"

db-reset: ## Reset database (CAUTION: deletes all data!)
	@echo "$(YELLOW)⚠️  This will delete all data. Are you sure? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	docker-compose exec postgres psql -U social_user -d postgres -c "DROP DATABASE IF EXISTS social_audit;"
	docker-compose exec postgres psql -U social_user -d postgres -c "CREATE DATABASE social_audit;"
	@make db-init
	@echo "$(GREEN)✓ Database reset complete$(NC)"

test: ## Run load tests on all stacks
	@echo "$(GREEN)Running load tests...$(NC)"
	@echo "$(YELLOW)Testing Flask...$(NC)"
	@ab -n 100 -c 10 http://flask.localhost/ 2>&1 | grep "Requests per second"
	@echo "$(YELLOW)Testing Astro...$(NC)"
	@ab -n 100 -c 10 http://astro.localhost/ 2>&1 | grep "Requests per second"
	@echo "$(YELLOW)Testing TanStack...$(NC)"
	@ab -n 100 -c 10 http://tanstack.localhost/ 2>&1 | grep "Requests per second"
	@echo "$(YELLOW)Testing Angular...$(NC)"
	@ab -n 100 -c 10 http://angular.localhost/ 2>&1 | grep "Requests per second"

stats: ## Show resource usage statistics
	docker stats --no-stream

open-flask: ## Open Flask in browser
	@command -v xdg-open > /dev/null && xdg-open http://flask.localhost || open http://flask.localhost

open-astro: ## Open Astro in browser
	@command -v xdg-open > /dev/null && xdg-open http://astro.localhost || open http://astro.localhost

open-tanstack: ## Open TanStack in browser
	@command -v xdg-open > /dev/null && xdg-open http://tanstack.localhost || open http://tanstack.localhost

open-angular: ## Open Angular in browser
	@command -v xdg-open > /dev/null && xdg-open http://angular.localhost || open http://angular.localhost

open-all: ## Open all stacks in browser
	@make open-flask
	@sleep 1
	@make open-astro
	@sleep 1
	@make open-tanstack
	@sleep 1
	@make open-angular

backup: ## Backup database to backup.sql
	@echo "$(GREEN)Creating database backup...$(NC)"
	docker-compose exec postgres pg_dump -U social_user social_audit > backup.sql
	@echo "$(GREEN)✓ Backup saved to backup.sql$(NC)"

restore: ## Restore database from backup.sql
	@echo "$(YELLOW)Restoring database from backup.sql...$(NC)"
	docker-compose exec -T postgres psql -U social_user social_audit < backup.sql
	@echo "$(GREEN)✓ Database restored$(NC)"

install-hosts: ## Add .localhost domains to /etc/hosts
	@echo "$(YELLOW)Adding domains to /etc/hosts (requires sudo)...$(NC)"
	@echo "127.0.0.1 flask.localhost astro.localhost tanstack.localhost angular.localhost traefik.localhost" | sudo tee -a /etc/hosts
	@echo "$(GREEN)✓ Domains added to /etc/hosts$(NC)"
