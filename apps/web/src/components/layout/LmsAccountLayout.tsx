import { Outlet } from "react-router-dom";

/**
 * The learner's own pages (تعلّمي, دوراتي, المحفوظة, الإنجازات, الشهادات) came
 * from the dashboard, which wrapped them in its own padded column. Under the
 * site layout nothing did, so they sat flush against the window on every side.
 * They share this column instead of each repeating it.
 */
export function LmsAccountLayout() {
  return (
    <div className="container-app py-8 md:py-10">
      <Outlet />
    </div>
  );
}
