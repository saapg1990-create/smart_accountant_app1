import { Stack } from 'expo-router';
import { DatabaseProvider } from '../context/DatabaseContext';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="ledger/index" />
          <Stack.Screen name="ledger/accounts" />
          <Stack.Screen name="ledger/account-groups" />
          <Stack.Screen name="ledger/journal-entry" />
          <Stack.Screen name="ledger/cash-boxes" />
          <Stack.Screen name="ledger/banks" />
          <Stack.Screen name="ledger/ewallets" />
          <Stack.Screen name="ledger/currencies" />
          <Stack.Screen name="ledger/trial-balance" />
          <Stack.Screen name="ledger/account-statement" />
          <Stack.Screen name="ledger/general-ledger" />
          <Stack.Screen name="inventory/index" />
          <Stack.Screen name="inventory/items" />
          <Stack.Screen name="inventory/suppliers" />
          <Stack.Screen name="inventory/purchase-invoice" />
          <Stack.Screen name="inventory/warehouses" />
          <Stack.Screen name="inventory/units" />
          <Stack.Screen name="inventory/categories" />
          <Stack.Screen name="inventory/brands" />
          <Stack.Screen name="inventory/purchase-return" />
          <Stack.Screen name="inventory/inventory-issue" />
          <Stack.Screen name="inventory/inventory-receipt" />
          <Stack.Screen name="inventory/warehouse-transfer" />
          <Stack.Screen name="inventory/stock-count" />
          <Stack.Screen name="inventory/stock-adjustment" />
          <Stack.Screen name="inventory/item-movement" />
          <Stack.Screen name="sales/index" />
          <Stack.Screen name="sales/customers" />
          <Stack.Screen name="sales/sales-invoice" />
          <Stack.Screen name="sales/reps" />
          <Stack.Screen name="sales/customer-groups" />
          <Stack.Screen name="sales/sales-return" />
          <Stack.Screen name="sales/quotation" />
          <Stack.Screen name="sales/customer-sales" />
          <Stack.Screen name="sales/item-sales" />
          <Stack.Screen name="sales/summary" />
          <Stack.Screen name="sales/rep-performance" />
          <Stack.Screen name="reports/index" />
          <Stack.Screen name="voice" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="owner" />
          <Stack.Screen name="about" />
          <Stack.Screen name="backup" />
        </Stack>
      </DatabaseProvider>
    </AppProvider>
  );
}
