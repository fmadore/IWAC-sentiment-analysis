<!--
  Stand-in for svelte-echarts' <Chart> in component tests.

  ECharts initialises against a real canvas, which jsdom does not provide, so
  a component test that mounts a chart would fail for reasons unrelated to the
  component. Stubbing the chart body lets the surrounding logic — toolbars,
  empty states, aria wiring, mode toggles — be tested; the rendering itself is
  covered by the browser pass.
-->
<div data-testid="echarts-stub"></div>
