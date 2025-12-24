import { Outlet } from "react-router-dom";
import { Header } from "./Header";
// import { FloatingActionButton } from "./FloatingActionButton";

export const Layout = () => {
  return (
    <div className="min-h-screen w-full">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      {/* <FloatingActionButton /> */}
    </div>
  );
};