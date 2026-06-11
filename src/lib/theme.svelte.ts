let _dark = $state(false);

function apply() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', _dark);
    localStorage.setItem('theme', _dark ? 'dark' : 'light');
  }
}

export const theme = {
  get dark() {
    return _dark;
  },
  toggle() {
    _dark = !_dark;
    apply();
  },
  init() {
    if (typeof document !== 'undefined') {
      const saved = localStorage.getItem('theme');
      _dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
      apply();
    }
  },
};
