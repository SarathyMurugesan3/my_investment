# Render Deployment Setup

Deploy the platform easily on Render using the preconfigured blueprint.

1. Create a Render account.
2. Select **Blueprints** from dashboard and click **New Blueprint Instance**.
3. Link your fork repository.
4. Render reads the blueprint from `render.yaml` and initializes:
   - A Spring Boot Java Web Service.
   - A Static Web Service publishing `frontend/dist`.
5. Supply environment settings (`MONGODB_URI`) directly in the Blueprint configuration UI.
