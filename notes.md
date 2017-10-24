# add stylus stuff
- grid:
  - http://jeet.gs/ !!
  - http://oddbird.net/susy/docs/b-api.html
- typo: http://milligram.io/typography.html
- breakpoints: http://jescalan.github.io/rupture/ !!

## maybe
- tooltips: https://tiaanduplessis.github.io/wenk/
  - will be removed anyway if not used



# new pages/component structure]
- one file with all pages `peregrine.pages`
- components can have multiple templates but only one `seed.default.js`
  - alternative seed data should be entered when adding the module to the page
  - any missing seed data from the page config will fallback to the default (can be disabled)

  - this will make dynamic page generation easier

# other todos
- automatic style and script inport when component is used on page