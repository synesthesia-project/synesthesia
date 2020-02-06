
export default (typeof window === 'undefined') ?
  require('perf_hooks').performance : performance;
