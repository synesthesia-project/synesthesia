/* eslint-disable @typescript-eslint/no-var-requires  */
export default typeof window === 'undefined'
  ? require('perf_hooks').performance
  : performance;
