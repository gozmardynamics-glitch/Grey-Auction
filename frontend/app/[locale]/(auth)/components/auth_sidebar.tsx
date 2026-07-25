import AuthBackButton from './auth_back_button';

const AuthSidebar = () => {
  return (
    <aside className="hidden lg:flex items-center justify-center px-10 py-24">
      <div className="flex h-full w-full flex-col justify-between p-8">
        <AuthBackButton />

        <div className="flex items-center  w-full">
          <div className=" font-light text-primary-foreground">
            <h1 className="mb-3 text-4xl font-bold">
              Buy & Sell Smarter with Live Auctions
            </h1>
            <p className="text-xl leading-relaxed">
              Join a secure marketplace where buyers compete in real-time
              auctions and sellers reach genuine buyers faster — all in one
              powerful platform.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AuthSidebar;
