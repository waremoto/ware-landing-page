# -*- coding: utf-8 -*-
"""Genera el bloque de paletas de style.css.
Fuente de verdad de las 6 paletas GhostShell: Ghost/apps/Ghost.Dashboard/app/assets/css/main.css seccion 2.
La paleta `maremoto` reproduce EXACTAMENTE los tokens que la landing tenia antes del cambio."""

HOVER = "color-mix(in srgb, var(--g-accent) 86%, transparent)"

# key: (label, dark dict, light dict)
P = {}

P["maremoto"] = ("Maremoto", dict(
    bg="#0B0D10", surface2="#101317", surface="#161A20",
    line="#1B1F26", line2="#232830",
    ink="#E8EAED", dim="#A6ADB8", faint="#838C99",
    accent="#F0A93B", accent2="#FFC46B", on="#0B0D10",
    good="#6FCF97", crit="#E27C7C", warn="#F0A93B", info="#7FB3E8",
), dict(
    bg="#FBFAF8", surface2="#FFFFFF", surface="#F3F1ED",
    line="#EBE8E2", line2="#E1DED7",
    ink="#14171B", dim="#4E555F", faint="#5F6771",
    accent="#A66200", accent2="#8F5400", on="#FFFFFF",
    good="#1F7A4C", crit="#B23B3B", warn="#92400e", info="#2B6BA8",
))

P["default"] = ("Ghost", dict(
    bg="#000000", surface2="#0d0d0d", surface="#000000",
    line="rgba(255,255,255,.28)", line2="rgba(255,255,255,.44)",
    ink="#ffffff", dim="#d4d4d8", faint="#a1a1aa",
    accent="#ffffff", accent2=HOVER, on="#000000",
    good="#34d399", crit="#ff6b66", warn="#fbbf24", info="#60a5fa",
), dict(
    bg="#ffffff", surface2="#f4f4f5", surface="#ffffff",
    line="rgba(0,0,0,.34)", line2="rgba(0,0,0,.52)",
    ink="#000000", dim="#27272a", faint="#52525b",
    accent="#18181b", accent2=HOVER, on="#ffffff",
    good="#047857", crit="#b91c1c", warn="#92400e", info="#1d4ed8",
))

P["monochrome"] = ("Monochrome", dict(
    bg="#0a0a0a", surface2="#1a1a1a", surface="#0a0a0a",
    line="rgba(255,255,255,.26)", line2="rgba(255,255,255,.42)",
    ink="#fafafa", dim="#c9c9c9", faint="#969696",
    accent="#d4d4d8", accent2=HOVER, on="#0a0a0a",
    good="#34d399", crit="#ff6b66", warn="#fbbf24", info="#9ca3af",
), dict(
    bg="#eaeaea", surface2="#ededed", surface="#ffffff",
    line="rgba(0,0,0,.32)", line2="rgba(0,0,0,.48)",
    ink="#000000", dim="#2e2e2e", faint="#545454",
    accent="#27272a", accent2=HOVER, on="#ffffff",
    good="#047857", crit="#b91c1c", warn="#92400e", info="#4b5563",
))

P["ocean"] = ("Ocean", dict(
    bg="#0a1120", surface2="#141d30", surface="#0a1120",
    line="rgba(130,165,225,.30)", line2="rgba(130,165,225,.46)",
    ink="#f2f7ff", dim="#b8c6de", faint="#8496b4",
    accent="#60a5fa", accent2=HOVER, on="#04101f",
    good="#34d399", crit="#ff6b66", warn="#fbbf24", info="#60a5fa",
), dict(
    bg="#e6ecf5", surface2="#e9eff8", surface="#ffffff",
    line="rgba(28,48,88,.30)", line2="rgba(28,48,88,.46)",
    ink="#060e1c", dim="#2b3a52", faint="#4d5f7c",
    accent="#1d4ed8", accent2=HOVER, on="#ffffff",
    good="#047857", crit="#b91c1c", warn="#92400e", info="#1d4ed8",
))

P["warm"] = ("Warm", dict(
    bg="#17130d", surface2="#221b12", surface="#17130d",
    line="rgba(232,205,158,.28)", line2="rgba(232,205,158,.44)",
    ink="#fdf6e8", dim="#c9b894", faint="#97886a",
    accent="#fbbf24", accent2=HOVER, on="#2a1c06",
    good="#34d399", crit="#ff6b66", warn="#fbbf24", info="#e8cd9e",
), dict(
    bg="#f1ece2", surface2="#f3eee4", surface="#fffdf8",
    line="rgba(90,68,38,.30)", line2="rgba(90,68,38,.46)",
    ink="#1a1208", dim="#52442f", faint="#6b5b43",
    accent="#a94d08", accent2=HOVER, on="#fffdf8",
    good="#047857", crit="#b91c1c", warn="#92400e", info="#7c5a2a",
))

P["rose"] = ("Rose", dict(
    bg="#140a0d", surface2="#201318", surface="#140a0d",
    line="rgba(255,175,195,.28)", line2="rgba(255,175,195,.44)",
    ink="#fdf0f3", dim="#cdb2b9", faint="#9c8087",
    accent="#fb7185", accent2=HOVER, on="#14060a",
    good="#34d399", crit="#ff6b66", warn="#fbbf24", info="#f9a8d4",
), dict(
    bg="#f3ebee", surface2="#f5edf0", surface="#ffffff",
    line="rgba(60,24,34,.30)", line2="rgba(60,24,34,.46)",
    ink="#1a0a0f", dim="#543038", faint="#7d5760",
    accent="#be123c", accent2=HOVER, on="#ffffff",
    good="#047857", crit="#b91c1c", warn="#92400e", info="#9d174d",
))

P["lowcontrast"] = ("Low Contrast", dict(
    bg="#09090b", surface2="#1b1b1f", surface="#09090b",
    line="rgba(255,255,255,.11)", line2="rgba(255,255,255,.17)",
    ink="#e8e2d4", dim="#a8a191", faint="#8f887a",
    accent="#d4d4d8", accent2=HOVER, on="#09090b",
    good="#159b7c", crit="#ef4b46", warn="#e6a53a", info="#8ab4d8",
), dict(
    bg="#eef1f6", surface2="#f7f9fc", surface="#ffffff",
    line="rgba(12,24,45,.09)", line2="rgba(12,24,45,.14)",
    ink="#10192a", dim="#4a5b72", faint="#6b7c94",
    accent="#52525b", accent2=HOVER, on="#ffffff",
    good="#0f9e82", crit="#d8322e", warn="#b9770d", info="#2b6ba8",
))

# La paleta que ve un visitante que nunca toco nada. Cambiar aca, regenerar, y
# mantener DEFAULTS.palette de theme.js en el mismo valor (el CSS es el fallback
# sin JS; theme.js estampa el atributo en cuanto corre).
DEFAULT = "default"

ORDER = ["maremoto", "default", "monochrome", "ocean", "warm", "rose", "lowcontrast"]

def decl(v, scheme):
    return ("    --g-bg: {bg}; --g-surface-2: {surface2}; --g-surface: {surface};\n"
            "    --g-line: {line}; --g-line-2: {line2};\n"
            "    --g-ink: {ink}; --g-ink-dim: {dim}; --g-ink-faint: {faint};\n"
            "    --g-accent: {accent}; --g-accent-2: {accent2}; --g-on-accent: {on};\n"
            "    --g-good: {good}; --g-crit: {crit}; --g-warn: {warn}; --g-info: {info};\n"
            "    color-scheme: {sch};\n").format(sch=scheme, **v)

def main():
  out = []
  for k in ORDER:
      label, dark, light = P[k]
      # La paleta por defecto se ancla a :root:not([data-palette]) y NO a :root a secas:
      # un selector sin cualificar filtra sobre las otras paletas a igual especificidad.
      if k == DEFAULT:
          base = ':root:not([data-palette]), :root[data-palette="%s"]' % k
          lightsel_media = ':root:not([data-palette]):not([data-theme="dark"]), :root[data-palette="%s"]:not([data-theme="dark"])' % k
          lightsel = ':root:not([data-palette])[data-theme="light"], :root[data-palette="%s"][data-theme="light"]' % k
      else:
          base = ':root[data-palette="%s"]' % k
          lightsel_media = ':root[data-palette="%s"]:not([data-theme="dark"])' % k
          lightsel = ':root[data-theme="light"][data-palette="%s"]' % k
      out.append("/* --- %s -------------------------------------------------- */" % label)
      out.append("%s {\n%s}" % (base, decl(dark, "dark")))
      out.append("@media (prefers-color-scheme: light) {\n  %s {\n  %s  }\n}"
                 % (lightsel_media, decl(light, "light").replace("\n    ", "\n      ")))
      out.append("%s {\n%s}" % (lightsel, decl(light, "light")))
      out.append("")

  print("\n".join(out))

if __name__ == "__main__":
  main()
