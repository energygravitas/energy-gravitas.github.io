# ABOUTME: Ruby dependencies for building the site, locally and in the Pages workflow.
# ABOUTME: Deployed by .github/workflows/pages.yml; upgrade with `bundle update`.
source "https://rubygems.org"

gem "jekyll", "~> 4.4"
gem "minima", "~> 2.5"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.18"
  gem "jekyll-seo-tag", "~> 2.9"
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :windows, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Required by `jekyll serve` on Ruby 3+.
gem "webrick", "~> 1.9"
