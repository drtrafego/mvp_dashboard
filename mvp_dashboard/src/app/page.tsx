export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">HyperDash</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Sistema funcionando!</p>
        <a href="/auth/signin" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          Ir para login
        </a>
      </div>
    </div>
  );
}
