#Wake on LAN (WOL) es un estándar de redes de computadoras Ethernet que permite encender remotamente computadoras apagadas.
$dirpc=".\macs.txt"
foreach ($MacAddress in Get-Content $dirpc)
{
[byte[]] $MagicPacket = 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
$MagicPacket += (($MacAddress.split(':') | foreach {[byte]('0x' + $_)}) * 16)
$UdpClient = New-Object System.Net.Sockets.UdpClient
$UdpClient.Connect(([System.Net.IPAddress]::Broadcast) ,9)
$UdpClient.Send($MagicPacket,$MagicPacket.length)
}