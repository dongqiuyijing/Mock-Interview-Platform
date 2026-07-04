export const LandingFooter = () => {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display text-base font-extrabold tracking-tight">
          RoleReady
        </span>
        <p className="text-xs text-muted-foreground">
          AI-industry mock interview workspace
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} RoleReady
        </p>
      </div>
    </footer>
  );
};
