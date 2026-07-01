#!/bin/bash
echo "📦 جاري تصدير كل أكواد المشروع..."
rm -f all_code.txt

for f in $(find app src context hooks -name "*.tsx" -o -name "*.ts" 2>/dev/null | sort); do
  echo "" >> all_code.txt
  echo "/* ================================================" >> all_code.txt
  echo "   FILE: $f" >> all_code.txt
  echo "   LINES: $(wc -l < $f)" >> all_code.txt
  echo "   ================================================ */" >> all_code.txt
  echo "" >> all_code.txt
  cat "$f" >> all_code.txt
  echo "" >> all_code.txt
done

echo "✅ تم! الملف: all_code.txt"
echo "📏 الحجم: $(wc -l < all_code.txt) سطر"
ls -lh all_code.txt
