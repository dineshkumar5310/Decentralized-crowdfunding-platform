# Create zip archive of crowdfunding app
$sourcePath = "c:/Users/DELL/crowdfunding-app1"
$zipPath = "c:/Users/DELL/crowdfunding-app1/crowdfunding-app.zip"

# Change to source directory
Set-Location $sourcePath

# Get all items except excluded directories
$items = Get-ChildItem -Force | Where-Object { 
    $_.Name -ne 'node_modules' -and 
    $_.Name -ne 'artifacts' -and 
    $_.Name -ne 'cache' -and 
    $_.Name -eq '.git' -and
    $_.Name -ne 'google-cloud-sdk.zip'
}

# Use Compress-Archive with wildcard for all included items
Compress-Archive -Path * -DestinationPath $zipPath 2>&1

if (Test-Path $zipPath) {
    Write-Host "SUCCESS: Zip file created at: $zipPath"
} else {
    Write-Host "ERROR: Failed to create zip file"
}
