
Монитор адвоката — модули и данные
----------------------------------
Содержимое папок:
- monadv/modules/*.js — ES-модули. Каждый экспортирует default async function render(el, {cdn, store}).
- monadv/data/*.json — данные (списки судов и статьи УК).

Как использовать:
1) Загрузите эти файлы в GitHub по тем же путям.
2) Создайте релиз (например, v1.0.0).
3) В Тильде в Head HTML пропишите:
   window.MONADV_CDN = "https://cdn.jsdelivr.net/gh/<USER>/monadv@v1.0.0/monadv/";
4) Вставьте загрузчик Тильды (панель вкладок) — он подтягивает модули из MONADV_CDN/modules/*.js
