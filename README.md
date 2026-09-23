Order Tracking Screen

A mobile order tracking screen for an e-commerce app, built with React and Vite. It uses mock data only, so there is no backend.

The old screen only showed a status word (Processing, Shipped, Out for Delivery, Delivered). This version shows where the order is, when it will arrive, and what to do if something goes wrong.

Screens

Use the tabs at the top of the page to switch between cases.

On the way: normal delivery with an arrival time.
Delayed: the estimate has passed. Shows the new date, why it is late, and a way to contact support.
Not received: the order says delivered but the customer did not get it. Shows quick things to check, the delivery photo, and a report form.
No tracking yet: the order exists but the courier has not picked it up. Shows the expected ship date instead of an empty screen.
Loading, Empty and Error: the other states a real app needs.

Every order screen has a status card with a 4-step progress bar, the delivery history (latest update first, "See all updates" for the rest), a product summary, an order details popup, and a support button that stays at the bottom.

How to run

You need Node.js 18

bash
npm install
npm run dev

Open the link shown in the terminal (http://localhost:5173).

Files
src/OrderTracking.jsx: the whole screen (mock data, status logic, components and styles).
src/main.jsx: starts the app.
