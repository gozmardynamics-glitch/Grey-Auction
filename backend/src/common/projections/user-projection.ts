/**
 * Response-DTO pass: the single source of truth for hydrating a User relation
 * into an API response that crosses a trust boundary.
 *
 * The global ClassSerializerInterceptor already strips @Exclude()-marked
 * columns (passwordHash, OTP state) as a belt-and-braces net, but a projected
 * relation is the *systematic* guarantee: the SQL itself never fetches the
 * sensitive columns, so no future query change can regress the posture.
 *
 * Rule of thumb:
 *  - PUBLIC_PUBLIC (anonymous callers): name + join date only.
 *  - MEMBER_PUBLIC (authenticated callers): the same set — room members,
 *    bid feeds and participants never need more.
 *  - SELF / admin-scoped endpoints may select full columns explicitly.
 *
 * Usage (TypeORM):
 *   relations: ['bidder'],
 *   select: { bidder: USER_PUBLIC_SELECT },
 */
export const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  createdAt: true,
} as const;

/** Alias for readability at member-facing call sites. */
export const USER_MEMBER_SELECT = USER_PUBLIC_SELECT;
