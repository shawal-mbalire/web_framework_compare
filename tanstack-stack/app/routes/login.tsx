import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import type { FormEvent } from 'react';
import { loginFn, registerFn } from '~/lib/server';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

const input = 'w-full rounded border p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none';
const button =
  'w-full rounded-full bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50';

function formValues(event: FormEvent<HTMLFormElement>): Record<string, string> {
  event.preventDefault();
  return Object.fromEntries(
    [...new FormData(event.currentTarget)].map(([k, v]) => [k, String(v)])
  );
}

function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useServerFn(loginFn);
  const register = useServerFn(registerFn);

  const onSuccess = async () => {
    await queryClient.invalidateQueries();
    await navigate({ to: '/' });
  };

  const loginMutation = useMutation({
    mutationFn: (v: Record<string, string>) =>
      login({ data: { username: v.username ?? '', password: v.password ?? '' } }),
    onSuccess,
  });
  const registerMutation = useMutation({
    mutationFn: (v: Record<string, string>) =>
      register({
        data: { username: v.username ?? '', email: v.email ?? '', password: v.password ?? '' },
      }),
    onSuccess,
  });

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-10 md:grid-cols-2">
      <form
        onSubmit={(e) => loginMutation.mutate(formValues(e))}
        className="space-y-3 rounded-lg border bg-white p-6"
      >
        <h1 className="text-xl font-bold">Log in</h1>
        <input className={input} name="username" placeholder="Username or email" autoComplete="username" required />
        <input className={input} name="password" type="password" placeholder="Password" autoComplete="current-password" required />
        {loginMutation.error && <p className="text-sm text-red-500">{loginMutation.error.message}</p>}
        <button className={button} disabled={loginMutation.isPending}>
          Log in
        </button>
        <p className="text-sm text-gray-500">
          Demo accounts: alice, bob, carol… password <code>password123</code>
        </p>
      </form>

      <form
        onSubmit={(e) => registerMutation.mutate(formValues(e))}
        className="space-y-3 rounded-lg border bg-white p-6"
      >
        <h2 className="text-xl font-bold">Create account</h2>
        <input className={input} name="username" placeholder="Username" autoComplete="username" required />
        <input className={input} name="email" type="email" placeholder="Email" autoComplete="email" required />
        <input className={input} name="password" type="password" placeholder="Password (8+ characters)" autoComplete="new-password" minLength={8} required />
        {registerMutation.error && (
          <p className="text-sm text-red-500">{registerMutation.error.message}</p>
        )}
        <button className={button} disabled={registerMutation.isPending}>
          Sign up
        </button>
      </form>
    </main>
  );
}
