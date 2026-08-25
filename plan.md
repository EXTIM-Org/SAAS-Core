1.  **Public Order Receipt Page**:
    *   Create `apps/dashboard/src/app/store/[projectId]/order/[orderId]/page.tsx`
    *   It should fetch the order details via a server action or direct API call (e.g., using `getOrdersHistoryAction` to find the specific order by `orderId`). Since `getOrdersHistoryAction` gets all orders, I might need to filter it or just use it as is if there isn't a specific `getOrderById` endpoint. Let's check if there's a `getOrderById` endpoint in `apps/api/src/orders/orders.controller.ts`. I checked earlier and there was only `getOrders(userId, projectId)`. Wait, I should probably create a specific `getOrdersHistoryAction` or adapt the component to fetch orders and filter. Wait, is there a `getOrders` endpoint by id? No, just the list. I'll just fetch all and find the matching `orderId`.
    *   The UI should match `StoreLayout` (meaning it's wrapped by the layout already) and show a clean receipt using Shadcn UI Card and Table components. It displays Order ID, Status, Itemized List, and Total Amount.

2.  **Smart Checkout Redirection (`apps/dashboard/src/components/CartDrawer.tsx`)**:
    *   Update `CartDrawer.tsx` to handle the checkout process.
    *   It currently just has a static `<Button className="w-full" size="lg">Checkout</Button>`.
    *   We need to add a `handleCheckout` function that calls `processCheckoutAction`.
    *   Use `usePathname` from `next/navigation` to determine if we are in the admin dashboard (`/dashboard/projects/...`) or the public storefront (`/store/...`).
    *   If in the public storefront, on success, redirect to `/store/[projectId]/order/[orderId]`. If in admin dashboard, we could close the cart or redirect elsewhere (the instructions say "detect whether the user is currently browsing the Admin Dashboard... or the Public Storefront... If in the Public Storefront, upon a successful checkout... use next.js redirect/router.push...").
    *   Also need to show a clear error or prompt if the user is unauthenticated (e.g., API returns 401/403 or error message).
    *   I'll pass the `projectId` to `CartDrawer` as a prop or infer it from the pathname. Since `projectId` isn't currently a prop, I can extract it from `useParams()` or `usePathname()`. Let's use `useParams()` in `CartDrawer.tsx` to get `projectId`. Actually, `projectId` could be passed down.

3.  **Authentication Handling**:
    *   If checkout fails due to auth (e.g., "Unauthorized"), show a toast message or prompt suggesting login.

4.  **Pre-commit steps**:
    *   Run linting, type checking, etc.
