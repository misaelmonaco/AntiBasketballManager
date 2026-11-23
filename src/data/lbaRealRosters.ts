import { ALL_TEAM_TEMPLATES } from './teams';
import {
  computeAgeFromBirthDate,
  getSeasonAgeReferenceDate,
  parseBirthDateToItalian,
} from '../engine/calendarUtils';
import { Nationality, Position } from '../types';
import type { CustomPlayerTemplate } from '../services/editorDbService';

const RAW_LBA_PLAYERS_CSV = `teamId,teamName,leagueId,firstName,lastName,jerseyNumber,position,nationality,isItalianFormation,overall,birthDate
udi,APU Old Wild West Udine,lba,Denzel,Valentine,,SG/SF,USA,False,78,1993-11-16
udi,APU Old Wild West Udine,lba,Eimantas,Bendžius,,PF,Lituania,False,77,1990-04-23
udi,APU Old Wild West Udine,lba,Žan Mark,Šiško,,PG,Slovenia,False,76,1997-06-29
udi,APU Old Wild West Udine,lba,RaeQuan,Battle,,SG,USA,False,76,2001-03-04
udi,APU Old Wild West Udine,lba,Nick,McGlynn,,C,USA,False,75,1996-10-06
udi,APU Old Wild West Udine,lba,Skylar,Spencer,,C,USA,False,75,1994-07-11
udi,APU Old Wild West Udine,lba,Andrea,Calzavara,,PG,Italia,True,73,2001-09-29
udi,APU Old Wild West Udine,lba,Lorenzo,Bucarelli,,SG/SF,Italia,True,72,1998-03-15
udi,APU Old Wild West Udine,lba,Joseph,Mobio,,SF,Italia,True,70,1998-06-27
udi,APU Old Wild West Udine,lba,Matteo,Cavallero,,SF,Italia,True,69,2003-02-14
udi,APU Old Wild West Udine,lba,Mattia,Grassi,,SG,Italia,True,63,2007-10-05
udi,APU Old Wild West Udine,lba,Alessandro,Pavan,,SG,Italia,True,61,2008-01-02
tre,Aquila Basket Trento,lba,Quincy,Olivari,,SG,USA,False,79,2001-05-27
tre,Aquila Basket Trento,lba,Charlie,Brown Jr.,,SF,USA,False,77,1997-02-02
tre,Aquila Basket Trento,lba,Selom,Mawugbe,,C,USA / Ghana,False,76,1998-07-20
tre,Aquila Basket Trento,lba,Isaiah,Bigelow,,SF,USA,False,76,2000-01-05
tre,Aquila Basket Trento,lba,Darius,Brown II,,PG,USA,False,76,1999-07-28
tre,Aquila Basket Trento,lba,Jordan,Bayehe,,PF/C,Camerun / Italia,True,74,1999-10-16
tre,Aquila Basket Trento,lba,Alessandro,Bertini,,SG/SF,Italia,True,71,2002-09-22
tre,Aquila Basket Trento,lba,Andrés,Forray,,PG,Italia / Argentina,True,70,1986-03-20
tre,Aquila Basket Trento,lba,Cheickh,Niang,,SF,Italia / Senegal,True,69,2008-05-12
tre,Aquila Basket Trento,lba,Patrick,Hassan,,SG,Italia,True,68,2007-04-19
tre,Aquila Basket Trento,lba,José,Medina Bouza,,PG,Spagna,False,65,2007-05-01
tre,Aquila Basket Trento,lba,Federico,Cattapan,,SF,Italia,True,61,2008-05-27
tre,Aquila Basket Trento,lba,Cosimo,Flauto,,SG,Italia,True,61,2009-01-01
tre,Aquila Basket Trento,lba,Talel,Fezzani,,SF,Italia / Tunisia,True,61,N/D
rom_spqr,BC Roma SPQR,lba,Kelly,Olynyk,,C,Canada,False,84,1991-04-19
rom_spqr,BC Roma SPQR,lba,Niccolò,Mannion,,PG,Italia / USA,True,80,2001-03-14
rom_spqr,BC Roma SPQR,lba,Marko,Simonović,,C,Montenegro / Italia,True,78,1999-10-15
rom_spqr,BC Roma SPQR,lba,Trentyn,Flowers,,SF,USA,False,77,2005-03-08
rom_spqr,BC Roma SPQR,lba,Artūrs,Strautiņš,,SF,Lettonia / Italia,True,76,1998-10-23
rom_spqr,BC Roma SPQR,lba,Gérald,Ayayi,,SG,Francia,False,76,2001-08-24
rom_spqr,BC Roma SPQR,lba,Paul,Watson,,SF,USA,False,76,1994-12-30
rom_spqr,BC Roma SPQR,lba,Erik,Stevenson,,SG,USA,False,75,1999-04-28
rom_spqr,BC Roma SPQR,lba,Corey,Davis,,PG/SG,USA,False,75,1997-06-04
rom_spqr,BC Roma SPQR,lba,Andrea,Mezzanotte,,PF,Italia,True,72,1998-04-08
rom_spqr,BC Roma SPQR,lba,Giovanni,Emejuru,,C,Italia / Nigeria,True,69,2001-09-12
rom_spqr,BC Roma SPQR,lba,Michael,Iuzzolino,,SG,USA,False,68,N/D
tor,Derthona Basket (Tortona),lba,Christian,Vital,,SG,USA / Armenia,False,79,1997-03-21
tor,Derthona Basket (Tortona),lba,Karim,Jallow,,SF,Germania,False,78,1997-04-13
tor,Derthona Basket (Tortona),lba,Amar,Alibegović,,PF,Bosnia ed Erzegovina / Italia,True,78,1995-03-31
tor,Derthona Basket (Tortona),lba,Justin,Gorham,,PF,USA,False,77,1998-08-06
tor,Derthona Basket (Tortona),lba,Prentiss,Hubb,,PG,USA,False,77,1999-03-19
tor,Derthona Basket (Tortona),lba,Dominik,Olejniczak,,C,Polonia,False,76,1996-07-01
tor,Derthona Basket (Tortona),lba,Dante,Maddox Jr.,,SG,USA,False,76,2001-12-27
tor,Derthona Basket (Tortona),lba,Aljami,Durham,,SG,USA,False,75,1998-09-30
tor,Derthona Basket (Tortona),lba,Giordano,Bortolani,,SG,Italia,True,75,2000-12-02
tor,Derthona Basket (Tortona),lba,Paul,Eboua,,PF/C,Camerun / Italia,True,74,2000-02-15
tor,Derthona Basket (Tortona),lba,Andrea,Pecchia,,SF,Italia,True,72,1997-11-16
tor,Derthona Basket (Tortona),lba,Giulio,Gazzotti,,PF/C,Italia,True,69,1991-09-23
tor,Derthona Basket (Tortona),lba,Edoardo,Di Meo,,SG,Italia,True,62,2008-05-12
tor,Derthona Basket (Tortona),lba,Brayden,Zumstein,,SF,Italia / Svizzera,True,62,2008-07-07
rom_max,Maxima Roma,lba,Aaron,Holiday,,PG,USA,False,83,1996-09-30
rom_max,Maxima Roma,lba,Miro,Bilan,,C,Croazia,False,81,1989-07-21
rom_max,Maxima Roma,lba,Vernon,Carey Jr.,,C,USA,False,79,2001-02-25
rom_max,Maxima Roma,lba,John,Brown III,,PF/C,USA,False,79,1992-01-28
rom_max,Maxima Roma,lba,Xavier,Moon,,PG,USA,False,78,1995-01-02
rom_max,Maxima Roma,lba,Hunter,Tyson,,SF,USA,False,78,2000-06-13
rom_max,Maxima Roma,lba,Matt,Ryan,,SF,USA,False,77,1997-04-17
rom_max,Maxima Roma,lba,Brynton,Lemar,,SG,USA / Giamaica,False,76,1995-01-23
rom_max,Maxima Roma,lba,Mirza,Alibegović,,SG,Italia / Bosnia ed Erzegovina,True,74,1992-09-25
rom_max,Maxima Roma,lba,Carl,Wheatle,,SF,Regno Unito / Italia,True,74,1998-03-24
rom_max,Maxima Roma,lba,Gora,Camara,,C,Senegal / Italia,True,72,2001-04-12
rom_max,Maxima Roma,lba,Giovanni,Veronesi,,SG/SF,Italia,True,71,1998-06-14
rom_max,Maxima Roma,lba,Federico,Bonacini,,SG,Italia,True,70,1999-01-23
rom_max,Maxima Roma,lba,Andrea,Bresciani,,SG,Italia,True,62,2008-01-04
rom_max,Maxima Roma,lba,Andrija,Dožić,,SF,Montenegro,False,62,2007-07-28
rom_max,Maxima Roma,lba,Francesco,Carnevale,,PG,Italia,True,61,2007-05-11
nap,Napoli Basketball,lba,Markel,Brown,,SG,USA,False,80,1992-01-29
nap,Napoli Basketball,lba,Jeff,Dowtin Jr.,,PG,USA,False,79,1997-05-10
nap,Napoli Basketball,lba,Jahmi'us,Ramsey,,SG,USA,False,79,2001-06-09
nap,Napoli Basketball,lba,Jack,White,,SF,Australia,False,78,1997-08-05
nap,Napoli Basketball,lba,Marco,Spissu,,PG,Italia,True,78,1995-02-05
nap,Napoli Basketball,lba,Zac,Seljaas,,SF,USA,False,77,1997-07-11
nap,Napoli Basketball,lba,John,Petrucelli,,SG/SF,Italia / USA,True,77,1992-10-27
nap,Napoli Basketball,lba,Kaleb,Tarczewski,,C,USA,False,76,1993-02-26
nap,Napoli Basketball,lba,Leonardo,Totè,,PF/C,Italia,True,75,1997-07-08
nap,Napoli Basketball,lba,Guglielmo,Caruso,,PF/C,Italia,True,74,1999-07-03
nap,Napoli Basketball,lba,Andrej,Jakimovski,,SF,Macedonia del Nord / Italia,True,73,2001-03-18
nap,Napoli Basketball,lba,Leonardo,Faggian,,SG,Italia,True,70,2004-02-14
nap,Napoli Basketball,lba,Assane,Sankaré,,SF,Senegal / Italia,True,64,2007-04-10
nap,Napoli Basketball,lba,Emanuel,Esposito,,SG,Italia,True,61,2008-02-27
nap,Napoli Basketball,lba,Vittorio,Ferrara,,PG,Italia,True,60,2008-05-31
mil,Olimpia Milano,lba,Marko,Gudurić,,SG/SF,Serbia,False,84,1995-03-08
mil,Olimpia Milano,lba,Alec,Peters,,PF,USA / Bosnia ed Erzegovina,False,83,1995-04-13
mil,Olimpia Milano,lba,Darius,Thompson,,PG/SG,Italia / USA,True,82,1995-05-04
mil,Olimpia Milano,lba,Devon,Hall,,SG,USA,False,81,1995-07-07
mil,Olimpia Milano,lba,Leandro,Bolmaro,,SG/SF,Argentina / Italia,False,81,2000-09-11
mil,Olimpia Milano,lba,Moses,Wright,,C,USA,False,81,1998-12-23
mil,Olimpia Milano,lba,Devin,Booker,,PF/C,USA,False,80,1991-02-28
mil,Olimpia Milano,lba,Garrison,Mathews,,SG,USA,False,79,1996-10-24
mil,Olimpia Milano,lba,R.J.,Cole,,PG,USA,False,78,1999-08-24
mil,Olimpia Milano,lba,Jason,Burnell,,SF,USA,False,76,1997-08-15
mil,Olimpia Milano,lba,Stefano,Tonut,,SG,Italia,True,76,1993-11-07
mil,Olimpia Milano,lba,Giampaolo,Ricci,,PF,Italia,True,75,1991-09-27
mil,Olimpia Milano,lba,Ousmane,Diop,,PF/C,Senegal / Italia,True,74,2000-02-19
mil,Olimpia Milano,lba,Diego,Flaccadori,,PG/SG,Italia,True,74,1996-04-05
mil,Olimpia Milano,lba,Nicola,Akele,,SF,Italia,True,73,1995-11-07
mil,Olimpia Milano,lba,Baptiste,Chauveau,,SG,Francia,False,63,2008-02-25
can,Pallacanestro Cantù,lba,Erick,Green,,SG,USA,False,78,1991-05-09
can,Pallacanestro Cantù,lba,Andrejs,Gražulis,,PF,Lettonia,False,77,1993-07-21
can,Pallacanestro Cantù,lba,Savion,Flagg,,SF,USA,False,76,1999-05-26
can,Pallacanestro Cantù,lba,Osvaldas,Olisevičius,,SF,Lituania,False,76,1993-01-10
can,Pallacanestro Cantù,lba,Hassani,Gravett,,SG,USA,False,75,1996-07-16
can,Pallacanestro Cantù,lba,Michael,Smith,,PG/SG,USA,False,75,1995-07-06
can,Pallacanestro Cantù,lba,Chad,Brown,,C,USA,False,74,1996-09-06
can,Pallacanestro Cantù,lba,Riccardo,Moraschini,,SG/SF,Italia,True,74,1991-01-08
can,Pallacanestro Cantù,lba,Davide,Moretti,,PG/SG,Italia,True,74,1998-03-25
can,Pallacanestro Cantù,lba,Leonardo,Okeke,,C,Italia,True,72,2003-07-16
can,Pallacanestro Cantù,lba,Matteo,Parravicini,,PG,Italia,True,70,2001-06-14
can,Pallacanestro Cantù,lba,Liam,Udom,,SF,Italia,True,69,2000-06-27
can,Pallacanestro Cantù,lba,Simone,Ventura,,SG,Italia,True,62,2009-06-06
can,Pallacanestro Cantù,lba,Thomas,Acunzo,,SF,Italia,True,61,2008-04-28
reg,Pallacanestro Reggiana,lba,JT,Thor,,PF,Sudan del Sud / USA,False,79,2002-08-26
reg,Pallacanestro Reggiana,lba,Jaylen,Barford,,SG,USA,False,78,1996-01-23
reg,Pallacanestro Reggiana,lba,Speedy,Smith,,PG,USA,False,78,1993-01-28
reg,Pallacanestro Reggiana,lba,Dereck,Ogbeide,,C,Canada / Nigeria,False,77,1997-03-28
reg,Pallacanestro Reggiana,lba,Jaime,Echenique,,C,Colombia,False,77,1997-04-27
reg,Pallacanestro Reggiana,lba,Rob,Edwards,,SG,USA,False,76,1997-01-20
reg,Pallacanestro Reggiana,lba,Troy,Caupain,,PG,USA,False,76,1995-11-29
reg,Pallacanestro Reggiana,lba,Luca,Severini,,PF,Italia,True,74,1996-06-20
reg,Pallacanestro Reggiana,lba,Riccardo,Visconti,,SG/SF,Italia,True,74,1998-10-08
reg,Pallacanestro Reggiana,lba,Tomas,Woldetensae,,SG/SF,Italia / Eritrea,True,73,1998-04-30
reg,Pallacanestro Reggiana,lba,Lorenzo,Uglietti,,SG,Italia,True,72,1994-06-27
reg,Pallacanestro Reggiana,lba,Elhadj,Fainke,,PF/C,Mali / Italia,True,69,2005-06-25
reg,Pallacanestro Reggiana,lba,Michele,Rossato,,SG,Italia,True,61,N/D
tri,Pallacanestro Trieste,lba,Colbey,Ross,,PG,USA,False,80,1998-10-22
tri,Pallacanestro Trieste,lba,Lajae,Jones,,SF,USA,False,79,2004-05-21
tri,Pallacanestro Trieste,lba,Langston,Galloway,,SG,USA,False,78,1991-12-09
tri,Pallacanestro Trieste,lba,Sean,McDermott,,SF,USA,False,77,1996-11-03
tri,Pallacanestro Trieste,lba,Luka,Brajković,,C,Austria,False,75,1999-06-26
tri,Pallacanestro Trieste,lba,Michele,Ruzzier,,PG,Italia,True,74,1993-02-09
tri,Pallacanestro Trieste,lba,Francesco,Candussi,,PF/C,Italia,True,72,1994-02-23
tri,Pallacanestro Trieste,lba,Abramo,Canka,,SG/SF,Italia,True,71,2002-03-18
tri,Pallacanestro Trieste,lba,Lodovico,Deangeli,,SF,Italia,True,70,2000-08-24
tri,Pallacanestro Trieste,lba,Davide,Paiano,,SG,Italia,True,64,N/D
tri,Pallacanestro Trieste,lba,Emanuele,Martucci,,SF,Italia,True,61,2007-08-03
var,Pallacanestro Varese,lba,Hunter,Hale,,SG,USA,False,80,1997-06-25
var,Pallacanestro Varese,lba,Amedeo,Della Valle,,SG,Italia,True,79,1993-04-11
var,Pallacanestro Varese,lba,Ismaël,Kamagate,,C,Francia,False,78,2001-01-17
var,Pallacanestro Varese,lba,Isaiah,Roby,,PF,USA,False,78,1998-02-03
var,Pallacanestro Varese,lba,David,Duke Jr.,,SG,USA,False,77,1999-10-13
var,Pallacanestro Varese,lba,William,McDowell-White,,PG,Australia,False,76,1998-04-13
var,Pallacanestro Varese,lba,Davide,Alviti,,SF,Italia,True,75,1996-11-05
var,Pallacanestro Varese,lba,Nate,Renfro,,PF/C,USA,False,74,1996-12-11
var,Pallacanestro Varese,lba,Stefan,Nikolić,,SF,Serbia / Italia,True,72,1997-06-29
var,Pallacanestro Varese,lba,Matteo,Librizzi,,PG,Italia,True,72,2002-04-06
var,Pallacanestro Varese,lba,Iris,Ikangi,,SF,Italia,True,70,1994-02-21
var,Pallacanestro Varese,lba,Maximilian,Ladurner,,C,Italia,True,68,2001-12-06
var,Pallacanestro Varese,lba,Mauro,Villa,,SG,Italia,True,65,2004-07-07
var,Pallacanestro Varese,lba,Robert,Kangur,,PG,Estonia / Italia,True,63,2009-04-16
ven,Reyer Venezia Mestre,lba,Kyle,Wiltjer,,PF,Canada / USA,False,80,1992-10-20
ven,Reyer Venezia Mestre,lba,Louis,Olinde,,SF,Germania,False,79,1998-03-19
ven,Reyer Venezia Mestre,lba,Glynn,Watson,,PG,USA,False,78,1997-03-09
ven,Reyer Venezia Mestre,lba,Jordan,Parks,,SF,USA,False,78,1994-04-06
ven,Reyer Venezia Mestre,lba,Ky,Bowman,,PG/SG,USA,False,77,1997-06-16
ven,Reyer Venezia Mestre,lba,Sir'Jabari,Rice,,SG,USA,False,76,1998-12-28
ven,Reyer Venezia Mestre,lba,Amedeo,Tessitori,,C,Italia,True,76,1994-10-07
ven,Reyer Venezia Mestre,lba,Leonardo,Candi,,PG/SG,Italia,True,74,1997-03-30
ven,Reyer Venezia Mestre,lba,Enoch,Boakye,,C,Canada,False,73,2003-03-24
ven,Reyer Venezia Mestre,lba,Sasha,Grant,,SF,Italia,True,72,2002-02-15
ven,Reyer Venezia Mestre,lba,Giovanni,De Nicolao,,PG,Italia,True,71,1996-06-10
ven,Reyer Venezia Mestre,lba,Giga,Janelidze,,SF,Georgia / Italia,True,69,1995-04-01
ven,Reyer Venezia Mestre,lba,Octavio,Maretto,,SG,Argentina / Italia,True,69,2004-06-10
sca,Scafati Basket,lba,Charlie,Moore,,PG,USA,False,78,1998-02-03
sca,Scafati Basket,lba,Rodney,McGruder,,SG/SF,USA,False,77,1991-07-29
sca,Scafati Basket,lba,Brandon,Johnson,,PF,USA,False,76,1997-03-01
sca,Scafati Basket,lba,Ze'rik,Onyema,,PF/C,USA / Nigeria,False,75,2001-01-01
sca,Scafati Basket,lba,Mezie,Offurum,,SF,USA / Nigeria,False,74,2000-01-14
sca,Scafati Basket,lba,Ithiel,Horton,,SG,USA,False,74,2000-06-26
sca,Scafati Basket,lba,Mehdy,Ngouama,,PG,Francia,False,74,1995-07-06
sca,Scafati Basket,lba,Bruno,Mascolo,,PG/SG,Italia,True,74,1996-03-04
sca,Scafati Basket,lba,Alessandro,Lever,,PF/C,Italia,True,73,1998-12-04
sca,Scafati Basket,lba,Antonio,Iannuzzi,,C,Italia,True,70,1991-04-21
sca,Scafati Basket,lba,Marco,Ceron,,SG,Italia,True,69,1992-06-16
sca,Scafati Basket,lba,Francesco,Spinelli,,PG,Italia,True,61,2005-09-29
sca,Scafati Basket,lba,Lorenzo,Toro,,SG,Italia,True,60,N/D
ver,Scaligera Basket Verona,lba,Mike,Tobey,,C,USA / Slovenia,False,81,1994-10-10
ver,Scaligera Basket Verona,lba,CJ,Massinburg,,SG,USA,False,77,1997-04-14
ver,Scaligera Basket Verona,lba,Andrew,Andrews,,PG/SG,USA,False,77,1993-05-25
ver,Scaligera Basket Verona,lba,Jermaine,Samuels Jr.,,SF,USA,False,76,1998-11-12
ver,Scaligera Basket Verona,lba,Izaiah,Brockington,,SG,USA,False,76,1999-07-12
ver,Scaligera Basket Verona,lba,RJ,Melendez,,SF,Porto Rico / USA,False,75,2002-12-03
ver,Scaligera Basket Verona,lba,Milan,Barbitch,,PG/SG,Francia,False,74,2001-10-12
ver,Scaligera Basket Verona,lba,Federico,Zampini,,PG,Italia,True,72,1999-06-22
ver,Scaligera Basket Verona,lba,Federico,Poser,,PF/C,Italia,True,71,1999-09-25
ver,Scaligera Basket Verona,lba,Lorenzo,Ambrosin,,SG,Italia,True,70,1997-04-03
ver,Scaligera Basket Verona,lba,Andrea,Loro,,SF,Italia,True,70,2003-06-26
ver,Scaligera Basket Verona,lba,Maodo,Mane,,SF,Senegal / Italia,True,66,2007-12-31
ver,Scaligera Basket Verona,lba,Matteo,Olivieri,,SG,Italia,True,61,N/D
trv,Universo Treviso Basket,lba,DeWayne,Russell,,PG,USA,False,79,1994-02-10
trv,Universo Treviso Basket,lba,J.P.,Macura,,SG/SF,USA,False,79,1995-06-05
trv,Universo Treviso Basket,lba,Brekkott,Chapman,,PF,USA,False,76,1996-04-07
trv,Universo Treviso Basket,lba,Jeremy,Senglin,,SG,USA,False,76,1995-03-24
trv,Universo Treviso Basket,lba,Ike,Anigbogu,,C,USA / Nigeria,False,75,1998-10-16
trv,Universo Treviso Basket,lba,Ed,Croswell,,PF/C,USA,False,75,1999-09-06
trv,Universo Treviso Basket,lba,Chico,Carter Jr.,,SG,USA,False,74,2000-10-29
trv,Universo Treviso Basket,lba,Valentin,Chery,,PF/C,Francia,False,73,1997-09-24
trv,Universo Treviso Basket,lba,Alessandro,Cappelletti,,PG,Italia,True,73,1995-10-22
trv,Universo Treviso Basket,lba,Federico,Miaschi,,SG,Italia,True,71,2000-04-26
trv,Universo Treviso Basket,lba,Matteo,Chillo,,PF,Italia,True,70,1993-06-15
trv,Universo Treviso Basket,lba,Gregorio,Allinei,,SG,Italia,True,69,2004-04-07
trv,Universo Treviso Basket,lba,Alessandro,Manfredotti,,SG,Italia,True,61,2008-12-18
trv,Universo Treviso Basket,lba,Alessandro,Vettori,,SF,Italia,True,61,N/D
bol,Virtus Pallacanestro Bologna,lba,Bobi,Klintman,,SF,Svezia,False,82,2003-03-06
bol,Virtus Pallacanestro Bologna,lba,Kessler,Edwards,,SF,USA,False,80,2000-08-09
bol,Virtus Pallacanestro Bologna,lba,Marcus,Carr,,PG,Canada,False,79,1999-06-06
bol,Virtus Pallacanestro Bologna,lba,Trent,Frazier,,PG/SG,USA,False,79,1998-09-08
bol,Virtus Pallacanestro Bologna,lba,Wendell,Moore Jr.,,SG/SF,USA,False,79,2001-09-18
bol,Virtus Pallacanestro Bologna,lba,Derrick,Alston Jr.,,PF,USA,False,78,1997-09-17
bol,Virtus Pallacanestro Bologna,lba,Daniel,Hackett,,PG/SG,Italia / USA,True,77,1987-12-19
bol,Virtus Pallacanestro Bologna,lba,Mouhamet,Diouf,,PF/C,Italia,True,76,2001-09-10
bol,Virtus Pallacanestro Bologna,lba,Awudu,Abass,,SF,Italia,True,76,1993-01-27
bol,Virtus Pallacanestro Bologna,lba,Aliou,Diarra,,C,Mali,False,75,2001-12-31
bol,Virtus Pallacanestro Bologna,lba,Kevin,Kokila,,C,Francia / Angola,False,74,2001-09-03
bol,Virtus Pallacanestro Bologna,lba,Tommaso,Baldasso,,PG/SG,Italia,True,74,1998-01-29
bol,Virtus Pallacanestro Bologna,lba,Davide,Casarin,,PG/SG,Italia,True,73,2003-05-22
bol,Virtus Pallacanestro Bologna,lba,Rasheed,Bello,,PG,USA,False,72,2003-07-23
bol,Virtus Pallacanestro Bologna,lba,Francesco,Ferrari,,SF,Italia,True,70,2005-08-10
bol,Virtus Pallacanestro Bologna,lba,Achille,Lonati,,SG,Italia,True,66,2007-01-22
bol,Virtus Pallacanestro Bologna,lba,Matteo,Baiocchi,,SG,Italia,True,63,2007-08-02`;

const LBA_SHORT_ID_MAP: Record<string, string> = {
  udi: 'ita_lba_udine_bk',
  tre: 'ita_lba_trento_eagles',
  rom_spqr: 'ita_lba_roma_basket',
  tor: 'ita_lba_tortona_d',
  rom_max: 'ita_lba_m_roma',
  nap: 'ita_lba_napoli_bk',
  mil: 'ita_lba_milano_rossi',
  can: 'ita_lba_cantu_basket',
  reg: 'ita_lba_reggio_basket',
  tri: 'ita_lba_trieste_v',
  var: 'ita_lba_varese_basket',
  ven: 'ita_lba_venezia_lions',
  sca: 'ita_lba_pallacanestro_scafati',
  ver: 'ita_lba_verona_scudi',
  trv: 'ita_lba_treviso_ub',
  bol: 'ita_lba_v_nera_bologna',
};

const TEAM_NAME_ALIASES: Record<string, string> = {
  'udine bk': 'ita_lba_udine_bk',
  'apu old wild west udine': 'ita_lba_udine_bk',
  'trento eagles': 'ita_lba_trento_eagles',
  'aquila basket trento': 'ita_lba_trento_eagles',
  'roma basket': 'ita_lba_roma_basket',
  'bc roma spqr': 'ita_lba_roma_basket',
  'capitale basket (roma)': 'ita_lba_roma_basket',
  'tortona d': 'ita_lba_tortona_d',
  'derthona basket (tortona)': 'ita_lba_tortona_d',
  'm roma': 'ita_lba_m_roma',
  'maxima roma': 'ita_lba_m_roma',
  'napoli bk': 'ita_lba_napoli_bk',
  'napoli basketball': 'ita_lba_napoli_bk',
  'milano rossi': 'ita_lba_milano_rossi',
  'olimpia milano': 'ita_lba_milano_rossi',
  'cantù basket': 'ita_lba_cantu_basket',
  'cantu basket': 'ita_lba_cantu_basket',
  'pallacanestro cantù': 'ita_lba_cantu_basket',
  'reggio basket': 'ita_lba_reggio_basket',
  'pallacanestro reggiana': 'ita_lba_reggio_basket',
  'trieste v.': 'ita_lba_trieste_v',
  'trieste v': 'ita_lba_trieste_v',
  'pallacanestro trieste': 'ita_lba_trieste_v',
  'varese basket': 'ita_lba_varese_basket',
  'pallacanestro varese': 'ita_lba_varese_basket',
  'venezia lion': 'ita_lba_venezia_lions',
  'venezia lions': 'ita_lba_venezia_lions',
  'reyer venezia mestre': 'ita_lba_venezia_lions',
  'pallacanestro scafati': 'ita_lba_pallacanestro_scafati',
  'scafati basket': 'ita_lba_pallacanestro_scafati',
  'verona scudi': 'ita_lba_verona_scudi',
  'scaligera basket verona': 'ita_lba_verona_scudi',
  'treviso ub': 'ita_lba_treviso_ub',
  'universo treviso basket': 'ita_lba_treviso_ub',
  'v nera bologna': 'ita_lba_v_nera_bologna',
  'virtus pallacanestro bologna': 'ita_lba_v_nera_bologna',
};

const KNOWN_LBA_HEIGHTS_CM: Record<string, number> = {
  'Nick McGlynn': 206,
  'Skylar Spencer': 206,
  'Žan Mark Šiško': 190,
  'Denzel Valentine': 193,
  'Eimantas Bendžius': 207,
  'RaeQuan Battle': 196,
  'Joseph Mobio': 199,
  'Andrea Calzavara': 195,
  'Lorenzo Bucarelli': 196,
  'Selom Mawugbe': 208,
  'Isaiah Bigelow': 201,
  'Quincy Olivari': 191,
  'Charlie Brown Jr.': 198,
  'Darius Brown II': 188,
  'Andrés Forray': 187,
  'Jordan Bayehe': 203,
  'Cheickh Niang': 195,
  'Patrick Hassan': 185,
  'Alessandro Bertini': 196,
  'Niccolò Mannion': 190,
  'Kelly Olynyk': 211,
  'Marko Simonović': 213,
  'Artūrs Strautiņš': 198,
  'Gérald Ayayi': 191,
  'Trentyn Flowers': 206,
  'Erik Stevenson': 193,
  'Corey Davis': 185,
  'Paul Watson': 198,
  'Andrea Mezzanotte': 208,
  'Giovanni Emejuru': 211,
  'Michael Iuzzolino': 188,
  'Justin Gorham': 201,
  'Karim Jallow': 198,
  'Prentiss Hubb': 191,
  'Dominik Olejniczak': 213,
  'Aljami Durham': 193,
  'Dante Maddox Jr.': 188,
  'Christian Vital': 188,
  'Giulio Gazzotti': 202,
  'Giordano Bortolani': 193,
  'Andrea Pecchia': 197,
  'Paul Eboua': 203,
  'Amar Alibegović': 206,
  'Miro Bilan': 213,
  'Xavier Moon': 183,
  'Matt Ryan': 198,
  'Brynton Lemar': 193,
  'Vernon Carey Jr.': 208,
  'John Brown III': 203,
  'Hunter Tyson': 203,
  'Aaron Holiday': 183,
  'Mirza Alibegović': 196,
  'Giovanni Veronesi': 198,
  'Carl Wheatle': 200,
  'Federico Bonacini': 190,
  'Gora Camara': 214,
  'Zac Seljaas': 200,
  'Jack White': 201,
  'Jeff Dowtin Jr.': 191,
  "Jahmi'us Ramsey": 191,
  'Markel Brown': 191,
  'Kaleb Tarczewski': 213,
  'Marco Spissu': 184,
  'Guglielmo Caruso': 208,
  'John Petrucelli': 193,
  'Andrej Jakimovski': 203,
  'Leonardo Totè': 211,
  'Leonardo Faggian': 195,
  'Marko Gudurić': 198,
  'R.J. Cole': 185,
  'Alec Peters': 206,
  'Devon Hall': 196,
  'Jason Burnell': 201,
  'Leandro Bolmaro': 198,
  'Devin Booker': 206,
  'Garrison Mathews': 198,
  'Moses Wright': 206,
  'Darius Thompson': 193,
  'Giampaolo Ricci': 202,
  'Nicola Akele': 203,
  'Ousmane Diop': 204,
  'Stefano Tonut': 194,
  'Diego Flaccadori': 195,
  'Savion Flagg': 201,
  'Hassani Gravett': 188,
  'Andrejs Gražulis': 202,
  'Osvaldas Olisevičius': 200,
  'Chad Brown': 206,
  'Erick Green': 190,
  'Matteo Parravicini': 188,
  'Riccardo Moraschini': 194,
  'Liam Udom': 198,
  'Leonardo Okeke': 213,
  'Davide Moretti': 190,
  'JT Thor': 206,
  'Dereck Ogbeide': 206,
  'Jaime Echenique': 211,
  'Jaylen Barford': 191,
  'Rob Edwards': 196,
  'Speedy Smith': 191,
  'Troy Caupain': 193,
  'Lorenzo Uglietti': 192,
  'Elhadj Fainke': 205,
  'Luca Severini': 204,
  'Tomas Woldetensae': 196,
  'Riccardo Visconti': 198,
  'Sean McDermott': 198,
  'Langston Galloway': 185,
  'Colbey Ross': 185,
  'Lajae Jones': 201,
  'Luka Brajković': 208,
  'Lodovico Deangeli': 205,
  'Michele Ruzzier': 183,
  'Francesco Candussi': 211,
  'Abramo Canka': 198,
  'Hunter Hale': 191,
  'Nate Renfro': 203,
  'William McDowell-White': 196,
  'David Duke Jr.': 193,
  'Ismaël Kamagate': 211,
  'Isaiah Roby': 203,
  'Stefan Nikolić': 203,
  'Maximilian Ladurner': 207,
  'Davide Alviti': 201,
  'Iris Ikangi': 200,
  'Amedeo Della Valle': 194,
  'Mauro Villa': 190,
  'Matteo Librizzi': 180,
  'Robert Kangur': 185,
  "Sir'Jabari Rice": 193,
  'Kyle Wiltjer': 208,
  'Glynn Watson': 183,
  'Jordan Parks': 201,
  'Enoch Boakye': 208,
  'Louis Olinde': 205,
  'Ky Bowman': 185,
  'Amedeo Tessitori': 208,
  'Sasha Grant': 198,
  'Giga Janelidze': 201,
  'Leonardo Candi': 190,
  'Octavio Maretto': 194,
  'Giovanni De Nicolao': 191,
  'Mezie Offurum': 203,
  "Ze'rik Onyema": 203,
  'Brandon Johnson': 203,
  'Ithiel Horton': 196,
  'Charlie Moore': 180,
  'Rodney McGruder': 193,
  'Mehdy Ngouama': 188,
  'Bruno Mascolo': 190,
  'Alessandro Lever': 208,
  'Antonio Iannuzzi': 208,
  'Marco Ceron': 195,
  'CJ Massinburg': 196,
  'Jermaine Samuels Jr.': 201,
  'RJ Melendez': 201,
  'Izaiah Brockington': 193,
  'Andrew Andrews': 188,
  'Mike Tobey': 213,
  'Milan Barbitch': 196,
  'Federico Zampini': 191,
  'Lorenzo Ambrosin': 195,
  'Federico Poser': 203,
  'Andrea Loro': 202,
  'Brekkott Chapman': 206,
  'Valentin Chery': 200,
  'Ike Anigbogu': 208,
  'DeWayne Russell': 180,
  'Chico Carter Jr.': 188,
  'J.P. Macura': 196,
  'Ed Croswell': 203,
  'Jeremy Senglin': 188,
  'Matteo Chillo': 203,
  'Federico Miaschi': 200,
  'Alessandro Cappelletti': 186,
  'Gregorio Allinei': 194,
  'Bobi Klintman': 206,
  'Rasheed Bello': 183,
  'Marcus Carr': 188,
  'Derrick Alston Jr.': 206,
  'Kessler Edwards': 201,
  'Aliou Diarra': 206,
  'Trent Frazier': 188,
  'Wendell Moore Jr.': 196,
  'Kevin Kokila': 204,
  'Davide Casarin': 196,
  'Mouhamet Diouf': 206,
  'Awudu Abass': 198,
  'Daniel Hackett': 196,
  'Tommaso Baldasso': 192,
  'Francesco Ferrari': 204,
  'Matteo Baiocchi': 190,
};

const JERSEY_POOL = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 44, 55,
];

function parsePosition(rawPos: string): { primaryPosition: Position; secondaryPosition?: Position } {
  const upper = rawPos.trim().toUpperCase();
  if (upper.includes('/')) {
    const parts = upper
      .split('/')
      .map((p) => p.trim() as Position)
      .filter((p) => ['PG', 'SG', 'SF', 'PF', 'C'].includes(p));
    if (parts.length > 0) {
      const primaryPosition = parts[0];
      const secondaryPosition = parts[1] && parts[1] !== primaryPosition ? parts[1] : undefined;
      return { primaryPosition, secondaryPosition };
    }
  }
  if (['PG', 'SG', 'SF', 'PF', 'C'].includes(upper)) {
    return { primaryPosition: upper as Position };
  }

  switch (rawPos.trim().toLowerCase()) {
    case 'playmaker':
      return { primaryPosition: 'PG' };
    case 'playmaker/guardia':
      return { primaryPosition: 'PG', secondaryPosition: 'SG' };
    case 'guardia':
      return { primaryPosition: 'SG' };
    case 'guardia/ala':
      return { primaryPosition: 'SG', secondaryPosition: 'SF' };
    case 'ala':
      return { primaryPosition: 'SF' };
    case 'ala grande':
      return { primaryPosition: 'PF' };
    case 'ala/centro':
      return { primaryPosition: 'PF', secondaryPosition: 'C' };
    case 'centro':
      return { primaryPosition: 'C' };
    default:
      return { primaryPosition: 'SF' };
  }
}

const COUNTRY_TO_NATIONALITY: Record<string, Nationality> = {
  italia: 'ITA',
  usa: 'USA',
  canada: 'USA',
  australia: 'USA',
  'regno unito': 'USA',
  'sudan del sud': 'USA',
  'porto rico': 'USA',
  giamaica: 'USA',
  serbia: 'SRB',
  montenegro: 'SRB',
  'bosnia ed erzegovina': 'SRB',
  'macedonia del nord': 'SRB',
  georgia: 'SRB',
  spagna: 'ESP',
  colombia: 'ESP',
  lituania: 'LTU',
  svezia: 'LTU',
  francia: 'FRA',
  mali: 'FRA',
  senegal: 'FRA',
  camerun: 'FRA',
  nigeria: 'FRA',
  ghana: 'FRA',
  congo: 'FRA',
  angola: 'FRA',
  germania: 'GER',
  austria: 'GER',
  svizzera: 'GER',
  argentina: 'ARG',
  grecia: 'GRE',
  slovenia: 'SLO',
  croazia: 'CRO',
  polonia: 'CRO',
  lettonia: 'LAT',
  estonia: 'LAT',
};

function parseLbaNationality(rawNat: string, isItalianFormation: boolean): Nationality {
  const segments = rawNat
    .trim()
    .toLowerCase()
    .split('/')
    .map((s) => s.trim());

  if (segments[0] === 'italia') {
    return 'ITA';
  }

  for (const seg of segments) {
    const mapped = COUNTRY_TO_NATIONALITY[seg];
    if (mapped && mapped !== 'ITA') {
      return mapped;
    }
  }

  return isItalianFormation ? 'ITA' : 'USA';
}

function buildLbaRealRosters(): Record<string, CustomPlayerTemplate[]> {
  const teamTemplateById = new Map(ALL_TEAM_TEMPLATES.map((t) => [t.id, t]));
  const grouped = new Map<
    string,
    Array<{
      firstName: string;
      lastName: string;
      primaryPosition: Position;
      secondaryPosition?: Position;
      heightCm?: number;
      nationality: Nationality;
      isItalianFormation: boolean;
      jerseyNumber?: number;
      overall?: number;
      birthDate?: string;
    }>
  >();

  const lines = RAW_LBA_PLAYERS_CSV.trim().split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    if (cols.length < 9) continue;

    const shortTeamId = cols[0].trim().toLowerCase();
    const teamName = cols[1].trim();
    const firstName = cols[3].trim();
    const lastName = cols[4].trim();
    const rawJersey = cols[5].trim();
    const rawPos = cols[6].trim();
    const rawNat = cols[7].trim();
    const rawItaForm = cols[8].trim().toLowerCase();
    const rawOvr = (cols[9] ?? '').trim();
    const rawBirthDate = (cols[10] ?? '').trim();

    const teamId =
      LBA_SHORT_ID_MAP[shortTeamId] ?? TEAM_NAME_ALIASES[teamName.toLowerCase()];
    if (!teamId) continue;

    const { primaryPosition, secondaryPosition } = parsePosition(rawPos);
    const isItalianFormation = rawItaForm === 'true' || rawItaForm === '1' || rawItaForm === 'si';
    const nationality = parseLbaNationality(rawNat, isItalianFormation);
    const jerseyNum = rawJersey ? Number(rawJersey) : undefined;
    const parsedOvr = rawOvr ? Number(rawOvr) : undefined;
    const birthDate = parseBirthDateToItalian(rawBirthDate);
    const heightCm = KNOWN_LBA_HEIGHTS_CM[`${firstName} ${lastName}`];

    const list = grouped.get(teamId) ?? [];
    list.push({
      firstName,
      lastName,
      primaryPosition,
      secondaryPosition,
      heightCm,
      nationality,
      isItalianFormation,
      jerseyNumber: Number.isFinite(jerseyNum) ? jerseyNum : undefined,
      overall: Number.isFinite(parsedOvr) ? parsedOvr : undefined,
      birthDate,
    });
    grouped.set(teamId, list);
  }

  const refDate = getSeasonAgeReferenceDate(2026);
  const result: Record<string, CustomPlayerTemplate[]> = {};
  for (const [teamId, players] of grouped.entries()) {
    const tpl = teamTemplateById.get(teamId);
    const baseOvr = tpl
      ? tpl.avgOverall + (tpl.euroCup === 'EL' ? 4 : tpl.euroCup === 'EC' ? 2 : 0)
      : 72;

    result[teamId] = players.map((p, idx) => {
      let ovrOffset: number;
      if (idx < 5) {
        ovrOffset = 4 - Math.floor(idx / 2);
      } else if (idx < 10) {
        ovrOffset = 1 - (idx - 5);
      } else {
        ovrOffset = -4 - (idx - 10);
      }

      const age = p.birthDate ? computeAgeFromBirthDate(p.birthDate, refDate) : undefined;

      return {
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber ?? JERSEY_POOL[idx % JERSEY_POOL.length],
        primaryPosition: p.primaryPosition,
        secondaryPosition: p.secondaryPosition,
        heightCm: p.heightCm,
        age,
        birthDate: p.birthDate,
        nationality: p.nationality,
        isItalianFormation: p.isItalianFormation,
        overall: p.overall ?? Math.max(52, Math.min(88, baseOvr + ovrOffset)),
      };
    });
  }

  return result;
}

export const LBA_REAL_ROSTERS: Record<string, CustomPlayerTemplate[]> = buildLbaRealRosters();

export const LBA_REAL_BIRTHDATES_BY_NAME: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const roster of Object.values(LBA_REAL_ROSTERS)) {
    for (const p of roster) {
      if (p.birthDate) {
        map[`${p.firstName} ${p.lastName}`.trim().toLowerCase()] = p.birthDate;
      }
    }
  }
  return map;
})();
