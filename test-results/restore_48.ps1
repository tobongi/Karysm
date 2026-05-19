$bad = @(
  'coif_bantu_knots','coif_locs_retwist','coif_lace_wig_straight','coif_lace_wig_wavy',
  'barber_fade_beard','barber_classic_afro','barber_tapered','barber_buzz','barber_low_fade_full',
  'spa_body_wrap','spa_chocolate_wrap','spa_hammam_miel'
)
$pngDir = 'C:\Users\drama\Documents\DESPII\Karysm\test-results\v2_png'
$webpDir = 'C:\Users\drama\Documents\DESPII\Karysm\apps\mobile\assets\images\lookbook'

$pngs = Get-ChildItem -Path $pngDir -Filter 'karysm_v2_*.png'
$restored = 0
foreach ($p in $pngs) {
  $name = $p.BaseName -replace '^karysm_v2_','' -replace '_00001_$',''
  if ($bad -contains $name) { continue }
  $webp = Join-Path $webpDir "look_$name.webp"
  & ffmpeg -y -loglevel error -i $p.FullName -vf "scale=900:-2" -c:v libwebp -quality 84 -compression_level 6 $webp
  if (Test-Path $webp) { $restored++ }
}
"Restored: $restored"
