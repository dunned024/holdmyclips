# Hold My Clips - AI Assistant Context

## Project Summary

Hold My Clips is a serverless video hosting web application for sharing video clips among friends. Users can upload, view, trim, and comment on video clips. The application uses AWS infrastructure (S3, DynamoDB, Lambda, CloudFront, API Gateway, Cognito) deployed via AWS CDK, with a React frontend.

## Project Architecture

```
holdmyclips/
├── src/                    # React frontend application
├── infra/                  # AWS CDK infrastructure code
│   ├── lib/               # CDK stack definitions
│   └── services/          # Lambda function implementations
├── public/                # Static assets
├── build/                 # Production build output
└── utils/                 # Deployment and utility scripts
```

## Infrastructure (AWS CDK)

The infrastructure is defined in TypeScript using AWS CDK and consists of four main stacks:

### HostedDomainStack
- Imports existing Route53 hosted zone and ACM certificate
- Provides DNS and SSL/TLS certificate configuration for other stacks
- Resources are managed manually outside CDK

### AuthStack
- Creates Cognito User Pool for user authentication
- Configures OAuth 2.0 / OpenID Connect flows with authorization code grant
- Sets up custom domain for Cognito hosted UI (`oauth.{domain}` or `oauth-v2.{domain}` in prod)
- Manages user signup, login, email verification, and password reset flows
- Provides UserPool and UserPoolClient outputs for other stacks

### ClipdexStack
- **DynamoDB Table**: Stores clip metadata (id, title, uploader, uploadedOn, duration, description, fileExtension)
  - GSI: `AllClipsByUploadDate` - Query all clips sorted by upload date
  - GSI: `AllClipsByTitle` - Query all clips sorted by title
- **API Gateway**: REST API with direct DynamoDB integrations and Lambda integrations
  - `GET /clips` - Query all clips (direct DynamoDB integration)
  - `GET /clip/{id}` - Get single clip (direct DynamoDB integration)
  - `PUT /clipdata` - Upload clip metadata (Lambda)
  - `POST /presign` - Generate presigned S3 URLs for uploads (Lambda)
  - `POST /clipcomments` - Add comments (Lambda)
  - `DELETE /clipcomments` - Delete comments (Lambda)
- **Lambda Functions**: 
  - Upload, presign, and comments handlers with Cognito authentication
  - Shared layer for common utilities (Cognito auth)
  - Node.js 18.x runtime

### StaticSiteStack
- **S3 Bucket**: Stores static site assets and video clips
  - Lifecycle rule: Delete noncurrent versions after 14 days
  - CORS configuration for media streaming
- **CloudFront Distribution**: CDN for site delivery
  - Default behavior: Serve static site from S3
  - `/clips` and `/clip/*`: API Gateway origin (cached 5-10 min)
  - `/clipdata`, `/clipcomments`, `/presign`: API Gateway origin (no cache)
  - `/player/*`: S3 origin with Lambda@Edge for link preview generation
  - Error responses: 403/404 redirect to index.html for SPA routing
- **Lambda@Edge**: Link preview function for social media sharing

### Infrastructure Notes
- Stack naming uses camelCase environment suffix (e.g., `Dev`, `Prod`)
- Production stacks have deletion protection enabled
- All stacks are deployed to `us-east-1` (required for CloudFront/Lambda@Edge)
- **Important**: `infra/` uses CommonJS (NOT ES modules) per user preference

## Deployment (GitHub Actions)

### Automated CI/CD Workflow
- **File**: `.github/workflows/build-and-deploy.yml`
- **Dev Deployments**: Triggered on push to `main` branch
  - Conditionally rebuilds SPA only if source files changed (`src/`, `public/`, configs)
  - Always deploys infrastructure (CDK handles change detection)
  - Auto-creates draft pre-release with timestamp tag (e.g., `2025-11-01T1639`)
- **Prod Deployments**: Triggered when a release is published
  - Always rebuilds SPA and deploys infrastructure
  - Publish a draft pre-release to promote DEV code to PROD
- **Authentication**: Uses AWS OIDC (no long-lived access keys)
- **Required Secrets**: `AWS_ROLE_ARN_DEV`, `AWS_ROLE_ARN_PROD`

## Frontend

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (replaces Create React App)
- **UI Library**: Material-UI (MUI) v5 with Emotion styling
- **Routing**: React Router v6
- **Authentication**: `react-oidc-context` for OAuth/OIDC flows with Cognito
- **Video Processing**: FFmpeg WASM for client-side video trimming and thumbnail generation
- **Video Playback**: react-player with custom controls
- **Code Quality**: Biome for linting and formatting

### Frontend Organization

```
src/
├── index.tsx              # App entry point
├── App.tsx                # Main app component with routing
├── Home.tsx               # Home page (clip gallery)
├── context/
│   └── AuthContext.tsx    # OIDC authentication context provider
├── player/                # Video player components
│   ├── Player.tsx         # Main player with video and controls
│   ├── VideoController.tsx # Custom video controls
│   └── CommentsContainer.tsx # Comment display and creation
├── upload/                # Upload workflow components
│   ├── FileSelector.tsx   # File selection UI
│   ├── Previewer.tsx      # Preview selected video
│   ├── Uploader.tsx       # Main upload orchestrator
│   ├── UploadProgress.tsx # Upload progress UI
│   └── components/
│       ├── Trimmer.tsx    # Video trimming with FFmpeg
│       ├── Thumbnail.tsx  # Thumbnail crop/generation
│       └── UploadForm.tsx # Metadata input form
├── services/              # API and utility services
│   ├── clips.ts           # Clip CRUD operations
│   ├── comments.ts        # Comment operations
│   ├── cognito.ts         # Authentication helpers
│   └── clipIdentifiers.ts # Clip URL encoding/decoding
└── assets/
    ├── themes/theme.ts    # MUI theme configuration
    └── fonts/             # Custom fonts
```

### Key Frontend Features
- **Upload Flow**: Select video → Preview → Trim (optional) → Crop thumbnail → Add metadata → Upload
- **Clip Gallery**: Sortable grid of clips (by upload date or title, asc/desc)
- **Video Player**: Custom controls, fullscreen, playback speed, keyboard shortcuts
- **Comments**: Timestamped comments linked to video playback position
- **Authentication**: Protected routes, login/signup via Cognito hosted UI

### Local Development
- Frontend runs on port 3000 via Vite dev server
- Local development points to dev or prod cloud services (API Gateway, S3, Cognito)
- Configure environment using `.env.development.local` file with `VITE_*` variables
- Environment-specific config in `src/config.ts` uses Vite env vars (`VITE_*`)

## Instructions for Updating This File

**When to Update**: Update CLAUDE.md whenever you make significant changes to:
- Project architecture or major dependencies
- Infrastructure stack definitions or AWS resources
- Frontend technology choices or major dependencies
- Directory structure reorganization
- Development workflow or deployment process

**How to Update**: 
1. Keep updates **concise** - only document what changed
2. Update the relevant section (Infrastructure, Frontend, Architecture)
3. Maintain consistency with existing format and level of detail
4. Don't document temporary changes, experimental features, or implementation details
5. Focus on what future developers (or AI assistants) need to understand the project structure

**What NOT to Update**:
- Bug fixes or minor refactors
- Content changes (e.g., updating text in UI)
- Version bumps of existing dependencies
- New helper functions or utilities within existing structure
- Temporary or experimental code

