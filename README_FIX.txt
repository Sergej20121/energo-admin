Если npm install падает, выполните:
1) npm config set registry https://registry.npmjs.org/
2) npm install

Причина: package-lock.json из исходной сборки ссылался на внутренний реестр.
В этой версии package-lock.json удален.
