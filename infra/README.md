# HMC Infra

## How to Use

### Deploy Production (default)
```
cdk deploy --all
```

### Deploy Development
```
cdk deploy --all --context environment=dev
```

### Deploy Specific Stack to Dev
```
cdk deploy HMCAuthDev --context environment=dev
cdk deploy HMCClipdexDev --context environment=dev
cdk deploy HMCStaticSiteDev --context environment=dev
```
