import { SidebarNav } from "./sidebar-nav";
import { SIDEBAR_GRADIENT } from "@/lib/utils";

export function Sidebar() {
  return (
    <aside
      style={{ backgroundImage: SIDEBAR_GRADIENT }}
      className="fixed inset-y-0 left-0 z-40 hidden w-[268px] p-5 text-[#eef6f1] lg:block"
    >
      <SidebarNav />
    </aside>
  );
}
