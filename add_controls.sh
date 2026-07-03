#!/bin/bash

# قائمة الملفات اللي تحتاج ControlButtons مع الدوال المناسبة
declare -A fixes

fixes["app/ledger/banks.tsx"]="onAdd={openAdd} onRefresh={loadBanks}"
fixes["app/ledger/ewallets.tsx"]="onAdd={()=>setShowForm(true)} onRefresh={loadWallets}"
fixes["app/ledger/journal-entry.tsx"]="onRefresh={loadEntries}"
fixes["app/inventory/brands.tsx"]="onAdd={openAdd} onRefresh={loadData}"
fixes["app/inventory/categories.tsx"]="onAdd={openAdd} onRefresh={loadData}"
fixes["app/inventory/inventory-issue.tsx"]="onAdd={()=>setShowModal(true)}"
fixes["app/inventory/inventory-receipt.tsx"]="onAdd={()=>setShowModal(true)}"
fixes["app/inventory/qty-report.tsx"]="onRefresh={()=>{}}"
fixes["app/inventory/warehouse-transfer.tsx"]="onAdd={()=>setShowModal(true)}"
fixes["app/inventory/warehouses.tsx"]="onAdd={openAdd} onRefresh={loadData}"
fixes["app/sales/customers.tsx"]="onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} onRefresh={()=>{}}"
fixes["app/sales/reps.tsx"]="onAdd={openAdd} onRefresh={loadData}"
fixes["app/sales/summary.tsx"]="onRefresh={()=>{}}"

for file in "${!fixes[@]}"; do
  if [ -f "$file" ]; then
    # أضف import إذا مو موجود
    if ! grep -q "ControlButtons" "$file"; then
      sed -i '1s/^/import { ControlButtons, ControlHeader } from "..\/..\/src\/components\/ui\/ControlButtons";\n/' "$file"
    fi
    
    # أضف شريط الأزرار بعد الـ header
    controls="<ControlButtons showAdd showEdit showDelete showSearch showPrint showRefresh showExport ${fixes[$file]} />"
    
    if grep -q "ControlHeader" "$file"; then
      sed -i "/ControlHeader/a\      $controls" "$file"
    fi
    
    echo "✅ $file"
  fi
done
