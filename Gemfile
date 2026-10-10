# ABOUTME: Ruby dependencies for building the site locally.
# ABOUTME: Pinned to the github-pages gem so local builds match GitHub Pages' legacy build.
source "https://rubygems.org"

# GitHub Pages builds this repo with its own pinned Jekyll + plugins; this gem mirrors them.
# Upgrade with `bundle update github-pages`.
gem "github-pages", "~> 232", group: :jekyll_plugins

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :windows, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Required by `jekyll serve` on Ruby 3+.
gem "webrick", "~> 1.8"
