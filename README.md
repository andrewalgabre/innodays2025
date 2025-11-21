# AgriVue

AI-powered cow hoof disease detection using FLIR thermal imaging and Anthropic Claude / Google Gemini.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your API keys:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

Edit `src/environments/environment.ts` and add your API keys:
- **Anthropic Claude API Key**: Get from [console.anthropic.com](https://console.anthropic.com/)
- **Google Gemini API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)

### 3. GitHub Secrets (for CI/CD)

To deploy with GitHub Actions, add these secrets to your repository:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `GEMINI_API_KEY`: Your Gemini API key
   - `GEMINI_PROJECT_ID`: Your Google Cloud project ID

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically inject these secrets during build.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.


## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
