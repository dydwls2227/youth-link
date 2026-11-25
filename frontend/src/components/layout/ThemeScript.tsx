/**
 * 첫 페인트 전에 테마를 확정해 다크 모드에서 흰 화면이 번쩍이는 것을 막는다.
 * 저장된 선택이 없으면 OS 설정을 따른다.
 */
export function ThemeScript() {
  const script = `
(function () {
  try {
    var saved = localStorage.getItem("youthlink.theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (e) {}
})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
