# -*- coding: utf-8 -*-
"""Muestras del panel de debug: cada boton se pinta con SU paleta.
Se genera de la misma tabla que las paletas, asi no puede quedar desincronizado."""
from gen_palettes import P, ORDER

def block(sel, v):
    return ("%s {\n"
            "  --sw-bg: %s; --sw-ac: %s; --sw-ink: %s; --sw-line: %s;\n}"
            % (sel, v['bg'], v['accent'], v['ink'], v['line2']))

out = []
for k in ORDER:
    label, dark, light = P[k]
    sel = '.dbg-sw[data-palette="%s"]' % k
    out.append(block(sel, dark))
    out.append('@media (prefers-color-scheme: light) {\n  ' +
               block(':root:not([data-theme="dark"]) ' + sel, light).replace('\n', '\n  ') + '\n}')
    out.append(block(':root[data-theme="light"] ' + sel, light))
print("\n".join(out))
