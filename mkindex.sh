#!/bin/sh

echo "<!DOCTYPE html>
<html>

<head>
  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <meta name=\"google-site-verification\" content=\"d9wopPvOFgjfWnNvc2kxZcA99mkwtzqawEoFE7XuTYg\" />
  <title>wcout΄s GitHub page</title>
  <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\"/>
</head>
<body>
" >i.html

markdown index.md >>i.html

echo "
</body>
</html>" >>i.html

cp i.html index.html
rm i.html

echo "<!DOCTYPE html>
<html>

<head>
  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>FLTrator - FLTK arcade game</title>
  <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />
</head>
<body>
" >i.html

markdown fltrator.md >>i.html

echo "
</body>
</html>" >>i.html

cp i.html fltrator.html
rm i.html

echo "<!DOCTYPE html>
<html>

<head>
  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>FLTrator build instructions</title>
  <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />
</head>
<body>
" >i.html

markdown build.md >>i.html

echo "
</body>
</html>" >>i.html

cp i.html build.html
rm i.html

echo "<!DOCTYPE html>
<html>

<head>
  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>FLTK animated GIF display</title>
  <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />
</head>
<body>
" >i.html

markdown animgif.md >>i.html

echo "
</body>
</html>" >>i.html

cp i.html animgif.html
rm i.html

echo "<!DOCTYPE html>
<html>

<head>
  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>FLTK animated GIF display</title>
  <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />
</head>
<body>
" >i.html

markdown fast_fltk_proto.md >>i.html

echo "
</body>
</html>" >>i.html

cp i.html fast_fltk_proto.html
rm i.html

