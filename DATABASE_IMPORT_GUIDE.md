# Guida Importazione Database Esterno — Basket Manager Italia

Puoi modificare **tutte le squadre e tutti i giocatori** esternamente (con **Excel**, **Google Sheets**, **VS Code** o script) e importarli direttamente dall'**Editor Database** nel Menu Principale tramite il pulsante **"Import / Export Esterno (JSON / CSV)"**.

---

## Metodo 1: CSV per Excel / Google Sheets (Consigliato per i giocatori)

Dall'Editor puoi esportare un CSV già precompilato per tutte le 86 squadre o per una singola lega.
Il sistema riconosce automaticamente sia la virgola `,` sia il punto e virgola `;` (standard Excel italiano).

### A) CSV Giocatori
Intestazione:
```csv
teamId,teamName,leagueId,firstName,lastName,jerseyNumber,position,nationality,isItalianFormation,overall
```

Esempio:
```csv
teamId,teamName,leagueId,firstName,lastName,jerseyNumber,position,nationality,isItalianFormation,overall
lba_mil,Milano Rossi,ITA_LBA,Marco,Belinelli,3,SG,ITA,true,78
lba_mil,Milano Rossi,ITA_LBA,Shavon,Shields,31,SF,USA,false,85
```

- **`teamId`** oppure **`teamName`**: basta uno dei due per associare il giocatore alla squadra (es. `lba_mil` oppure `Milano Rossi`).
- **`position`**: `PG`, `SG`, `SF`, `PF`, `C`
- **`nationality`**: `ITA`, `USA`, `SRB`, `ESP`, `LTU`, `FRA`, `GER`, `ARG`, `GRE`, `SLO`, `CRO`, `LAT`
- **`isItalianFormation`**: `true`/`false` (oppure `si`/`no`, `1`/`0`). Se omesso, vale `true` per `ITA` e `false` per gli stranieri.
- **`overall`**: da `35` a `95`

### B) CSV Squadre
Intestazione:
```csv
teamId,leagueId,name,shortName,city,arena,primaryColor,secondaryColor
```

---

## Metodo 2: JSON Completo (v2)

Formato ideale se vuoi gestire club e roster in un unico file strutturato.
Puoi modificare anche **solo 1 squadra** (in modalità *"Unisci al DB attuale"*, le altre 85 squadre restano invariate).

```json
{
  "format": "basket-manager-italia-db",
  "version": 2,
  "teams": [
    {
      "id": "lba_mil",
      "matchName": "Milano Rossi",
      "name": "Olimpia Milano",
      "shortName": "MIL",
      "city": "Milano",
      "arena": "Unipol Forum",
      "primaryColor": "#D0021B",
      "secondaryColor": "#FFFFFF",
      "roster": [
        {
          "firstName": "Nico",
          "lastName": "Mannion",
          "jerseyNumber": 1,
          "primaryPosition": "PG",
          "nationality": "ITA",
          "isItalianFormation": true,
          "overall": 79
        },
        {
          "firstName": "Zach",
          "lastName": "LeDay",
          "jerseyNumber": 16,
          "primaryPosition": "PF",
          "nationality": "USA",
          "isItalianFormation": false,
          "overall": 84
        }
      ]
    }
  ]
}
```
