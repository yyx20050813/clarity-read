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
@(
  "window.__CLARITY_REPO__ = `"$repoUrl`";",
  "window.__CLARITY_PAGES__ = `"$pages`";"
) | Set-Content -Encoding utf8 site-config.js

$readme = Get-Content README.md -Raw
$readme = $readme -replace 'https://<your-username>\.github\.io/clarity-read/', $pages
Set-Content -Encoding utf8 README.md $readme

git add site-config.js README.md
git commit -m "Set live GitHub Pages and repository links"
git push

Write-Host "PAGES=$pages"
Write-Host "REPO=$repoUrl"
Write-Host "DOWNLOAD=${pages}downloads/clarity-read.zip"
