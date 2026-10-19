$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path", "User")
Set-Location "D:\专业实习"

gh auth status
$user = gh api user --jq .login
$repo = "clarity-read"

gh repo view "$user/$repo" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gh repo create $repo --public --source=. --remote=origin --push --description "澄阅 ClarityRead - focus reading browser extension"
} else {
  git remote remove origin 2>$null
  git remote add origin "https://github.com/$user/$repo.git"
  git push -u origin main
}

$body = '{"build_type":"legacy","source":{"branch":"main","path":"/"}}'
$bodyFile = Join-Path $env:TEMP "gh-pages-body.json"
Set-Content -Path $bodyFile -Value $body -Encoding ascii
gh api -X POST "repos/$user/$repo/pages" -H "Accept: application/vnd.github+json" --input $bodyFile 2>$null | Out-Null
gh api -X PUT "repos/$user/$repo/pages" -H "Accept: application/vnd.github+json" --input $bodyFile 2>$null | Out-Null

$pages = "https://$user.github.io/$repo/"
$repoUrl = "https://github.com/$user/$repo"

# 读写一律用 UTF-8（无 BOM）。Windows PowerShell 5.1 的 Get-Content / Set-Content
# 对无 BOM 文件按系统 ANSI(GBK) 处理，会把中文读成乱码再写成乱码（本仓库 README 曾因此损坏）。
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Utf8([string]$name) {
  [System.IO.File]::ReadAllText((Join-Path (Get-Location) $name), $utf8)
}
function Write-Utf8([string]$name, [string]$text) {
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) $name), $text, $utf8)
}

$siteConfig = "window.__CLARITY_REPO__ = `"$repoUrl`";`r`nwindow.__CLARITY_PAGES__ = `"$pages`";`r`n"
Write-Utf8 "site-config.js" $siteConfig

$readme = Read-Utf8 "README.md"
$readme = $readme -replace 'https://<your-username>\.github\.io/clarity-read/', $pages
Write-Utf8 "README.md" $readme

git add site-config.js README.md
git commit -m "Set live GitHub Pages and repository links"
git push

Write-Host "PAGES=$pages"
Write-Host "REPO=$repoUrl"
Write-Host "DOWNLOAD=${pages}downloads/clarity-read.zip"
