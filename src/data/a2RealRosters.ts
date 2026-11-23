import { ALL_TEAM_TEMPLATES } from './teams';
import {
  computeAgeFromBirthDate,
  getSeasonAgeReferenceDate,
  parseBirthDateToItalian,
} from '../engine/calendarUtils';
import { Nationality, Position } from '../types';
import type { CustomPlayerTemplate } from '../services/editorDbService';

const RAW_A2_PLAYERS_CSV = `teamId,teamName,leagueId,firstName,lastName,jerseyNumber,position,nationality,isItalianFormation,overall,birthDate
ave,Avellino Basket,serie_a2,Federico,Mussini,4,PG,Italia,True,74,1996-03-12
ave,Avellino Basket,serie_a2,Blake,Francis,5,PG/SG,USA,False,77,1998-01-03
ave,Avellino Basket,serie_a2,Marco,Mollura,18,SF,Italia,True,69,1993-10-11
ave,Avellino Basket,serie_a2,Giacomo,Dell'Agnello,77,SF,Italia,True,70,1994-09-30
ave,Avellino Basket,serie_a2,Tariq,Owens,11,C,USA,False,75,1995-06-30
ave,Avellino Basket,serie_a2,Gianluca,Della Rosa,7,PG,Italia,True,68,1996-08-20
ave,Avellino Basket,serie_a2,Mattia,Palumbo,12,PG/SG,Italia,True,71,2000-09-23
ave,Avellino Basket,serie_a2,Lucas,Fresno,95,SG/SF,Argentina / Italia,True,66,2004-03-01
ave,Avellino Basket,serie_a2,Luca,Campogrande,35,SG/SF,Italia,True,70,1996-04-30
ave,Avellino Basket,serie_a2,Michele,Serpilli,33,SF,Italia,True,69,1999-03-12
ave,Avellino Basket,serie_a2,Andrea,Zerini,0,PF/C,Italia,True,71,1988-10-25
mes,Basket Mestre,serie_a2,Costantino,Bechi,2,PG,Italia,True,68,2002-02-13
mes,Basket Mestre,serie_a2,Keshawn,Curry,1,SG,USA,False,73,1998-12-27
mes,Basket Mestre,serie_a2,Hasan,Varence,10,PF/C,USA,False,72,1997-03-30
mes,Basket Mestre,serie_a2,Mauro,Zacchigna,11,SF,Italia,True,69,2004-06-16
mes,Basket Mestre,serie_a2,Lorenzo,Galmarini,4,PF/C,Italia,True,69,1995-06-15
mes,Basket Mestre,serie_a2,Nicola,Giordano,0,PG,Italia,True,67,2003-07-21
mes,Basket Mestre,serie_a2,Simone,Valsecchi,22,SG,Italia,True,66,2004-02-09
mes,Basket Mestre,serie_a2,Lorenzo,Calbini,7,PG/SG,Italia,True,69,2002-12-20
mes,Basket Mestre,serie_a2,Riccardo,Salvioni,40,SF,Italia,True,68,2004-01-28
mes,Basket Mestre,serie_a2,Matteo,Gherardini,18,C,Italia,True,65,2004-06-16
mes,Basket Mestre,serie_a2,Alessandro,Dalla Bernardina,95,SG,Italia,True,59,2009-03-07
tor_a2,Basket Torino,serie_a2,Federico,Massone,22,PG/SG,Italia,True,72,1998-05-01
tor_a2,Basket Torino,serie_a2,Simone,Pepe,40,SG,Italia,True,71,1993-03-29
tor_a2,Basket Torino,serie_a2,Tyler,Harvey,,SG,USA,False,76,1993-07-17
tor_a2,Basket Torino,serie_a2,Terry,Allen,15,SF,USA,False,74,1993-12-29
tor_a2,Basket Torino,serie_a2,Lorenzo,Benvenuti,25,C,Italia,True,70,1995-04-29
tor_a2,Basket Torino,serie_a2,Matteo,Corgnati,11,PG,Italia,True,68,2004-04-19
tor_a2,Basket Torino,serie_a2,Fadilou,Seck,,C,Senegal / Italia,True,67,1997-10-13
tor_a2,Basket Torino,serie_a2,Matteo,Ghirlanda,6,SF,Italia,True,66,2001-02-06
tor_a2,Basket Torino,serie_a2,Stefano,Faloppa,5,SF,Italia,True,59,2002-09-29
tor_a2,Basket Torino,serie_a2,Andrea,Scandiuzzi,,C,Italia,True,64,2004-09-14
tor_a2,Basket Torino,serie_a2,Angelo,Del Chiaro,16,C,Italia,True,70,2001-03-02
cen,Benedetto XIV Cento,serie_a2,Nicolò,Tanfoglio,4,PG,Italia,True,67,2005-07-21
cen,Benedetto XIV Cento,serie_a2,Avery,Woodson,1,SG,USA,False,73,1993-12-15
cen,Benedetto XIV Cento,serie_a2,Luca,Conti,8,SF,Italia,True,70,2000-12-20
cen,Benedetto XIV Cento,serie_a2,Stacy,Davis,21,PF,USA,False,74,1994-10-11
cen,Benedetto XIV Cento,serie_a2,Samuel,Moretti,33,PF/C,Italia,True,68,1998-10-20
cen,Benedetto XIV Cento,serie_a2,Michele,Munari,12,PG,Italia,True,63,2005-03-03
cen,Benedetto XIV Cento,serie_a2,Matteo,Montano,14,SG,Italia,True,70,1992-02-18
cen,Benedetto XIV Cento,serie_a2,Axel,Piccirilli,11,SF,Italia,True,64,2006-04-11
cen,Benedetto XIV Cento,serie_a2,Gabriele,Tarallo,17,SF,Italia,True,60,2004-05-18
cen,Benedetto XIV Cento,serie_a2,Yannick,Giombini,45,PF/C,Italia,True,66,2001-12-03
cen,Benedetto XIV Cento,serie_a2,Pietro,Aradori,10,SG/SF,Italia,True,75,1988-12-09
cen,Benedetto XIV Cento,serie_a2,Alessandro,Beggio,50,PG,Italia,True,58,2007-06-21
cen,Benedetto XIV Cento,serie_a2,Roberto,Bonora,9,SG,Italia,True,58,2008-04-17
sas,Dinamo Sassari,serie_a2,Kaza,Kajami-Keane,24,PG,Canada,False,76,1994-01-27
sas,Dinamo Sassari,serie_a2,Michele,Vitali,31,SG/SF,Italia,True,75,1991-10-31
sas,Dinamo Sassari,serie_a2,Joonas,Riismaa,25,SG/SF,Estonia / Italia,True,72,2002-03-06
sas,Dinamo Sassari,serie_a2,Jeff,Brooks,23,PF,USA / Italia,False,74,1989-06-12
sas,Dinamo Sassari,serie_a2,Bryce,Nze,0,PF/C,USA / Nigeria,False,74,1998-03-02
sas,Dinamo Sassari,serie_a2,Diego,Monaldi,30,PG,Italia,True,71,1993-04-03
sas,Dinamo Sassari,serie_a2,Riccardo,Pisano,11,SG,Italia,True,68,2005-04-11
sas,Dinamo Sassari,serie_a2,Alessandro,Grande,5,PG,Italia,True,70,1994-11-08
sas,Dinamo Sassari,serie_a2,Simone,Aromando,45,PF,Italia,True,69,1997-09-02
sas,Dinamo Sassari,serie_a2,Nicolò,Nobili,21,SF,Italia,True,65,2002-05-07
sas,Dinamo Sassari,serie_a2,Francesco,Brunu,2,SG,Italia,True,59,2008-06-06
sas,Dinamo Sassari,serie_a2,Michele,Cipriano,4,PG,Italia,True,58,2009-08-01
for_bo,Fortitudo Bologna,serie_a2,Alessandro,Zanelli,7,PG,Italia,True,71,1992-05-07
for_bo,Fortitudo Bologna,serie_a2,Jamel,Morris,2,SG,USA,False,76,1992-11-14
for_bo,Fortitudo Bologna,serie_a2,Alvise,Sarto,3,SG/SF,Italia,True,71,2000-04-13
for_bo,Fortitudo Bologna,serie_a2,Paulius,Sorokas,9,PF,Lituania,False,76,1992-10-13
for_bo,Fortitudo Bologna,serie_a2,Tommaso,Guariglia,8,C,Italia,True,70,1997-08-08
for_bo,Fortitudo Bologna,serie_a2,Matteo,Fantinelli,21,PG,Italia,True,74,1993-11-24
for_bo,Fortitudo Bologna,serie_a2,Riccardo,Galassi,,SG,Italia,True,65,2004-04-09
for_bo,Fortitudo Bologna,serie_a2,Valerio,Stazzonelli,,SF,Italia,True,63,2004-07-07
for_bo,Fortitudo Bologna,serie_a2,Todor,Radonjić,23,SF,Montenegro / Italia,True,69,1997-04-01
for_bo,Fortitudo Bologna,serie_a2,Simon,Anumba,6,SG/SF,Italia,True,68,1996-08-28
for_bo,Fortitudo Bologna,serie_a2,Massimiliano,Moretti,11,SF,Italia,True,67,2005-05-06
for_bo,Fortitudo Bologna,serie_a2,Valerio,Mazzola,22,PF/C,Italia,True,72,1988-03-07
for_bo,Fortitudo Bologna,serie_a2,Matteo,Barbieri,27,C,Italia,True,64,2003-05-27
for_bo,Fortitudo Bologna,serie_a2,Tommaso,D'Arcangeli,0,SG,Italia,True,59,2006-08-08
cas,Juvecaserta 2021,serie_a2,Domenico,D'Argenzio,10,PG,Italia,True,71,2001-03-21
cas,Juvecaserta 2021,serie_a2,Alessandro,Sperduto,15,SG,Italia,True,69,2000-06-15
cas,Juvecaserta 2021,serie_a2,Jaron,Johnson,92,SF,USA,False,74,1992-05-05
cas,Juvecaserta 2021,serie_a2,Andrea,Lo Biondo,27,PF,Italia,True,69,1998-09-08
cas,Juvecaserta 2021,serie_a2,Jalen Joseph,Henry,8,PF,USA,False,74,1996-01-08
cas,Juvecaserta 2021,serie_a2,Matteo,Laganà,9,PG/SG,Italia,True,70,2000-01-10
cas,Juvecaserta 2021,serie_a2,Emanuel,Terry,,C,USA,False,75,1996-08-21
cas,Juvecaserta 2021,serie_a2,Vittorio,Nobile,32,SG,Italia,True,69,1995-11-02
cas,Juvecaserta 2021,serie_a2,Luca,Brambilla,11,SF,Italia,True,66,1996-05-13
cas,Juvecaserta 2021,serie_a2,Damir,Hadžić,7,PF,Bosnia ed Erzegovina,False,68,1997-05-13
cas,Juvecaserta 2021,serie_a2,Fallou,Seck,,PF/C,Senegal / Italia,True,64,2003-09-12
cre,JuVi Cremona 1952,serie_a2,Facundo,Corvalán,7,PG,Argentina,False,73,1998-09-10
cre,JuVi Cremona 1952,serie_a2,Trayvon,Reed,,C,USA,False,72,1995-08-21
cre,JuVi Cremona 1952,serie_a2,Micheal,Anumba,3,SG/SF,Italia,True,70,1999-09-06
cre,JuVi Cremona 1952,serie_a2,Simone,Barbante,16,C,Italia,True,69,1999-08-29
cre,JuVi Cremona 1952,serie_a2,Alexander,Cicchetti,1,PF/C,Italia,True,67,1998-04-18
cre,JuVi Cremona 1952,serie_a2,Giacomo,Maspero,,PF,Italia,True,70,1992-12-31
cre,JuVi Cremona 1952,serie_a2,Lorenzo,Restelli,,SG,Italia,True,68,1996-03-20
cre,JuVi Cremona 1952,serie_a2,Alberto,Conti,9,SG/SF,Italia,True,71,1998-05-26
cre,JuVi Cremona 1952,serie_a2,Ursulo,D'Almeida,13,PF/C,Benin / Italia,True,66,2001-11-01
cre,JuVi Cremona 1952,serie_a2,Davide,Bruttini,11,C,Italia,True,69,1987-02-18
liv,Libertas Livorno 1947,serie_a2,Fabio,Valentini,7,PG,Italia,True,71,1999-08-25
liv,Libertas Livorno 1947,serie_a2,Jayvon,Graves,3,SG,USA,False,77,1998-12-29
liv,Libertas Livorno 1947,serie_a2,Matteo,Piccoli,14,SF,Italia,True,69,1995-04-02
liv,Libertas Livorno 1947,serie_a2,Matt,Tiby,5,PF,USA,False,75,1992-12-19
liv,Libertas Livorno 1947,serie_a2,Giovanni,Vildera,53,C,Italia,True,72,1995-03-04
liv,Libertas Livorno 1947,serie_a2,Lorenzo,Penna,24,PG,Italia,True,70,1998-01-21
liv,Libertas Livorno 1947,serie_a2,David,Cournooh,25,PG/SG,Italia,True,72,1990-07-28
liv,Libertas Livorno 1947,serie_a2,Niccolò,Filoni,75,SF,Italia,True,67,2001-03-11
liv,Libertas Livorno 1947,serie_a2,Luca,Tozzi,11,PF/C,Italia,True,68,1999-10-09
liv,Libertas Livorno 1947,serie_a2,Davide,Possamai,,C,Italia,True,66,2001-07-15
bri,New Basket Brindisi,serie_a2,Andrea,Cinciarini,40,PG,Italia,True,75,1986-06-21
bri,New Basket Brindisi,serie_a2,Kendrick,Ray,0,SG,USA,False,75,1994-01-26
bri,New Basket Brindisi,serie_a2,Riccardo,Bolpin,9,SG/SF,Italia,True,72,1997-02-09
bri,New Basket Brindisi,serie_a2,Ethan,Esposito,12,PF,Italia,True,72,1999-10-22
bri,New Basket Brindisi,serie_a2,JaCorey,Williams,22,C,USA,False,77,1994-06-12
bri,New Basket Brindisi,serie_a2,Lorenzo,Caroti,7,PG,Italia,True,70,1997-07-14
bri,New Basket Brindisi,serie_a2,Martino,Mastellari,8,SG/SF,Italia,True,68,1996-01-03
bri,New Basket Brindisi,serie_a2,Tommaso,Fantoma,15,SG,Italia,True,67,2003-10-23
bri,New Basket Brindisi,serie_a2,Gabriele,Miani,11,PF,Italia,True,70,2000-10-11
bri,New Basket Brindisi,serie_a2,Edoardo,Del Cadia,10,C,Italia,True,69,1999-03-10
bri,New Basket Brindisi,serie_a2,El,Ellis,3,PG,USA,False,74,1999-12-18
bri,New Basket Brindisi,serie_a2,Alessandro,Molinaro,5,SF,Italia,True,60,N/D
forli,Pallacanestro Forlì 2.015,serie_a2,Nicola,Berdini,1,PG,Italia,True,70,2003-12-04
forli,Pallacanestro Forlì 2.015,serie_a2,Toni,Perković,13,SG,Croazia,False,74,1998-04-10
forli,Pallacanestro Forlì 2.015,serie_a2,Fabio,Mian,9,SG/SF,Italia,True,72,1992-02-07
forli,Pallacanestro Forlì 2.015,serie_a2,Raphael,Gaspardo,10,PF,Italia,True,74,1993-08-03
forli,Pallacanestro Forlì 2.015,serie_a2,Marcus,Santos-Silva,7,C,USA,False,73,1997-06-07
forli,Pallacanestro Forlì 2.015,serie_a2,Mattia,Ceccato,25,PG,Italia,True,64,2007-06-08
forli,Pallacanestro Forlì 2.015,serie_a2,Tommaso,Pinza,30,SG,Italia,True,66,2006-05-10
forli,Pallacanestro Forlì 2.015,serie_a2,Andrija,Josović,23,SF,Serbia / Italia,True,65,2006-01-29
forli,Pallacanestro Forlì 2.015,serie_a2,Giacomo,Zanetti,19,SF,Italia,True,61,2005-09-08
forli,Pallacanestro Forlì 2.015,serie_a2,Davide,Pascolo,14,PF,Italia,True,73,1990-12-14
forli,Pallacanestro Forlì 2.015,serie_a2,Andrea,Costabile,12,SG,Italia,True,59,2008-01-01
mon,Pallacanestro Montecatini,serie_a2,Andrea,Bargnesi,12,PG,Italia,True,68,2001-01-03
mon,Pallacanestro Montecatini,serie_a2,Jordan,Harris,1,SG,USA,False,73,1997-10-09
mon,Pallacanestro Montecatini,serie_a2,Marquis,Barnett,44,SG/SF,USA,False,72,2003-05-03
mon,Pallacanestro Montecatini,serie_a2,Ion,Lupusor,7,PF,Moldavia / Italia,True,70,1996-01-27
mon,Pallacanestro Montecatini,serie_a2,Francesco,Pellegrino,29,C,Italia,True,70,1991-08-06
mon,Pallacanestro Montecatini,serie_a2,Federico,Burini,3,PG,Italia,True,67,1993-07-12
mon,Pallacanestro Montecatini,serie_a2,Lorenzo,Passoni,17,SG/SF,Italia,True,69,1997-07-30
mon,Pallacanestro Montecatini,serie_a2,Lorenzo,D'Alessandro,11,SF,Italia,True,66,1996-06-17
mon,Pallacanestro Montecatini,serie_a2,Mattia,Acunzo,4,PF/C,Italia,True,67,2000-06-22
mon,Pallacanestro Montecatini,serie_a2,Kārlis,Strautmanis,,SF,Lettonia,False,64,2001-07-05
mon,Pallacanestro Montecatini,serie_a2,Davide,Benvenuti,9,C,Italia,True,60,2007-01-15
vig,Pallacanestro Vigevano,serie_a2,Filippo,Gallo,44,PG,Italia,True,70,2004-05-03
vig,Pallacanestro Vigevano,serie_a2,Alfredo,Boglio,12,PG,Italia,True,68,2003-02-11
vig,Pallacanestro Vigevano,serie_a2,Isaiah,Brickner,5,SG,USA,False,71,2003-04-06
vig,Pallacanestro Vigevano,serie_a2,Edoardo,Tiberti,32,PF/C,Italia,True,68,1997-05-09
vig,Pallacanestro Vigevano,serie_a2,Khalid,Thomas,,SF/PF,USA,False,74,1999-07-23
vig,Pallacanestro Vigevano,serie_a2,Valerio,Cucchiaro,6,PG,Italia,True,67,2000-04-21
vig,Pallacanestro Vigevano,serie_a2,Nicola,Fantoma,20,SG,Italia,True,66,2006-07-20
vig,Pallacanestro Vigevano,serie_a2,Francesco,Reggiani,25,SG,Italia,True,61,2002-01-06
vig,Pallacanestro Vigevano,serie_a2,Riccardo,Crestan,22,SF,Italia,True,60,2007-06-14
vig,Pallacanestro Vigevano,serie_a2,Nemanja,Gajić,13,C,Serbia / Italia,True,64,2001-11-10
vig,Pallacanestro Vigevano,serie_a2,Charles,Atamah,10,PF/C,Nigeria / Italia,True,63,2006-07-02
pis,Pistoia Basket 2000,serie_a2,Matteo,Schina,8,PG,Italia,True,70,2001-03-16
pis,Pistoia Basket 2000,serie_a2,Maurice,Walker,,C,Canada / Regno Unito,False,74,1991-11-21
pis,Pistoia Basket 2000,serie_a2,Lorenzo,Pollone,,SF,Italia,True,69,1999-10-12
pis,Pistoia Basket 2000,serie_a2,Ife,Ajayi,33,PF,USA / Nigeria,False,73,1996-12-27
pis,Pistoia Basket 2000,serie_a2,Leonardo,Bettiol,3,SF,Italia,True,62,2002-09-26
pis,Pistoia Basket 2000,serie_a2,Lorenzo,Saccaggi,15,PG/SG,Italia,True,72,1992-08-30
pis,Pistoia Basket 2000,serie_a2,Ariel,Filloy,24,PG/SG,Italia / Argentina,True,73,1987-03-11
pis,Pistoia Basket 2000,serie_a2,Aristide,Mouaha,10,SG,Camerun / Italia,True,68,2000-08-18
pis,Pistoia Basket 2000,serie_a2,Antonio,Novori,12,SG,Italia,True,60,2007-09-12
pis,Pistoia Basket 2000,serie_a2,Gabriele,Benetti,0,PF,Italia,True,70,1995-06-30
pis,Pistoia Basket 2000,serie_a2,Simone,Zanotti,41,PF/C,Italia,True,71,1992-12-31
pis,Pistoia Basket 2000,serie_a2,Giacomo,Calza,16,SG,Italia,True,59,2009-03-02
rim,Rinascita Basket Rimini,serie_a2,Davide,Denegri,11,PG/SG,Italia,True,74,1998-05-08
rim,Rinascita Basket Rimini,serie_a2,Pierpaolo,Marini,13,SG,Italia,True,74,1993-10-08
rim,Rinascita Basket Rimini,serie_a2,Chuba,Ohams,,PF/C,USA / Nigeria,False,74,1997-12-22
rim,Rinascita Basket Rimini,serie_a2,Mattia,Udom,17,SF,Italia,True,72,1993-11-17
rim,Rinascita Basket Rimini,serie_a2,Quintin,Stephens,,PF,USA,False,73,1995-03-01
rim,Rinascita Basket Rimini,serie_a2,Saverio,Bartoli,40,PG/SG,Italia,True,70,2000-04-18
rim,Rinascita Basket Rimini,serie_a2,Giovanni,Tomassini,7,PG/SG,Italia,True,71,1988-05-31
rim,Rinascita Basket Rimini,serie_a2,Matteo,Lenci,8,SG,Italia,True,60,2007-10-08
rim,Rinascita Basket Rimini,serie_a2,Gianmarco,De Gregori,,SF,Italia,True,60,N/D
rim,Rinascita Basket Rimini,serie_a2,Giacomo,Leardini,0,PF,Italia,True,68,1999-12-07
rim,Rinascita Basket Rimini,serie_a2,Alessandro,Simioni,27,C,Italia,True,72,1998-03-10
rie,RSR Sebastiani Rieti,serie_a2,Matteo,Imbrò,10,PG/SG,Italia,True,74,1994-02-12
rie,RSR Sebastiani Rieti,serie_a2,Devonte,Green,11,SG,USA,False,75,1997-02-02
rie,RSR Sebastiani Rieti,serie_a2,Giovanni,Severini,28,SG/SF,Italia,True,70,1993-04-23
rie,RSR Sebastiani Rieti,serie_a2,Vittorio,Bartoli,32,SF,Italia,True,70,2002-06-11
rie,RSR Sebastiani Rieti,serie_a2,Romello,White,0,C,USA,False,74,1998-05-09
rie,RSR Sebastiani Rieti,serie_a2,Jacopo,Rota,,PG,Italia,True,67,1997-07-07
rie,RSR Sebastiani Rieti,serie_a2,Lorenzo,Piccin,13,SG,Italia,True,69,2002-11-18
rie,RSR Sebastiani Rieti,serie_a2,Fallou,Sow,35,C,Senegal / Italia,True,66,2007-02-20
rie,RSR Sebastiani Rieti,serie_a2,Mihajlo,Jerković,25,SF,Serbia / Italia,True,64,1999-06-21
rie,RSR Sebastiani Rieti,serie_a2,El Hadji,Deme,24,C,Senegal / Italia,True,62,2007-04-06
rie,RSR Sebastiani Rieti,serie_a2,Vincenzo,Attanasio,26,SG,Italia,True,59,2010-12-22
rie,RSR Sebastiani Rieti,serie_a2,Marco Tullio,Bellini,8,SF,Italia,True,59,2009-08-19
ruv,Ruvo di Puglia,serie_a2,Matteo,Bogliardi,12,PG,Italia,True,69,2002-03-17
ruv,Ruvo di Puglia,serie_a2,Jazz,Johnson,22,SG,USA,False,74,1996-09-26
ruv,Ruvo di Puglia,serie_a2,Vincenzo,Guaiana,14,SG/SF,Italia,True,69,2000-12-01
ruv,Ruvo di Puglia,serie_a2,Riccardo,Chinellato,16,SF,Italia,True,70,2000-01-22
ruv,Ruvo di Puglia,serie_a2,Dustin,Hogue,24,PF/C,USA,False,74,1992-06-30
ruv,Ruvo di Puglia,serie_a2,Thomas,Reale,10,PG/SG,Italia,True,68,2002-04-22
ruv,Ruvo di Puglia,serie_a2,Leonardo,Valesin,7,SG,Italia,True,66,2006-02-13
ruv,Ruvo di Puglia,serie_a2,Carmine,Berardi,17,SG,Italia,True,62,2009-01-17
ruv,Ruvo di Puglia,serie_a2,Falilou,Mbacke,1,C,Senegal / Italia,True,67,2004-11-23
ruv,Ruvo di Puglia,serie_a2,Prince,Lumena,26,SF,Serbia / Italia,True,65,2007-07-26
ruv,Ruvo di Puglia,serie_a2,Luca,Basile,19,PG,Italia,True,59,N/D
civ,UEB Cividale,serie_a2,Tommaso,Vecchiola,10,PG,Italia,True,70,2004-04-21
civ,UEB Cividale,serie_a2,Lucio,Redivo,3,SG,Argentina / Italia,False,76,1994-02-14
civ,UEB Cividale,serie_a2,Daishon,Knight,,SG,USA,False,74,1991-06-21
civ,UEB Cividale,serie_a2,Alessandro,Ferrari,7,SF,Italia,True,72,2003-05-05
civ,UEB Cividale,serie_a2,Matteo,Berti,19,C,Italia,True,71,1998-08-18
civ,UEB Cividale,serie_a2,Ivan,Mobio,0,SF,Italia,True,69,2004-10-12
civ,UEB Cividale,serie_a2,Luca,Cesana,90,SG,Italia,True,71,1997-07-17
civ,UEB Cividale,serie_a2,Federico,Bottelli,5,SG,Italia,True,65,2008-07-03
civ,UEB Cividale,serie_a2,Werther,Bellinaso,15,PG,Italia,True,62,2008-05-31
civ,UEB Cividale,serie_a2,Cosimo,Costi,11,SF,Italia,True,68,2000-12-04
civ,UEB Cividale,serie_a2,Abdramane,Tiagande,,C,Costa d'Avorio / Italia,True,64,2005-03-12
civ,UEB Cividale,serie_a2,Filippo,Baldi Rossi,8,PF/C,Italia,True,73,1991-10-26
ura,Urania Milano,serie_a2,Stefano,Gentile,22,PG/SG,Italia,True,72,1989-08-20
ura,Urania Milano,serie_a2,Tyreek,Scott-Grayson,0,SG,USA,False,74,1998-09-04
ura,Urania Milano,serie_a2,Alessandro,Gentile,5,SG/SF,Italia,True,76,1992-11-12
ura,Urania Milano,serie_a2,Nazzareno,Italiano,31,SF,Italia,True,71,1991-07-15
ura,Urania Milano,serie_a2,Anthony,Morse,4,C,USA,False,74,1994-04-13
ura,Urania Milano,serie_a2,Edoardo,Saccoccia,,SG,Italia,True,68,2006-01-15
ura,Urania Milano,serie_a2,Matteo,Pollone,20,SG/SF,Italia,True,69,1999-09-27
ura,Urania Milano,serie_a2,Filippo,Galli,12,PG,Italia,True,61,2005-09-22
ura,Urania Milano,serie_a2,Pietro,Lasagni,25,SF,Italia,True,60,2007-06-22
ura,Urania Milano,serie_a2,Giancarlo,Morgillo,,PF/C,Italia,True,67,2000-02-14
ura,Urania Milano,serie_a2,Jacopo,Barbieri,16,SG,Italia,True,59,N/D
ura,Urania Milano,serie_a2,Stefano,Bracale,14,SF,Italia,True,59,2008-01-23
ura,Urania Milano,serie_a2,Gabriele,Calvio,,SG,Italia,True,58,N/D
pes,V.L. Pesaro,serie_a2,Andrea,De Nicolao,9,PG,Italia,True,75,1991-08-21
pes,V.L. Pesaro,serie_a2,Matteo,Tambone,,SG,Italia,True,73,1994-05-14
pes,V.L. Pesaro,serie_a2,Myles,Mack,,PG,USA,False,74,1993-02-25
pes,V.L. Pesaro,serie_a2,Niccolò,De Vico,21,SF,Italia,True,72,1994-07-19
pes,V.L. Pesaro,serie_a2,Regimantas,Miniotas,22,PF/C,Lituania,False,76,1996-03-14
pes,V.L. Pesaro,serie_a2,Lorenzo,Trucchetti,,PG,Italia,True,68,2004-04-28
pes,V.L. Pesaro,serie_a2,Gabriele,Stefanini,4,SG,Italia,True,71,1999-07-18
pes,V.L. Pesaro,serie_a2,Matteo,Accorsi,8,SG/SF,Italia,True,67,2007-05-13
pes,V.L. Pesaro,serie_a2,Mikk,Jurkatamm,7,SG/SF,Estonia / Italia,True,70,2000-09-18
pes,V.L. Pesaro,serie_a2,Yancarlos,Sissoko,,C,Spagna / Mali,False,65,2004-09-11
pes,V.L. Pesaro,serie_a2,Mabor,Dut Biar,44,C,Sudan del Sud / Italia,True,64,2001-12-21`;

const A2_SHORT_ID_MAP: Record<string, string> = {
  ave: 'ita_a2_basket_avellino',
  mes: 'ita_a2_m_mestre',
  tor_a2: 'ita_a2_torino_t',
  cen: 'ita_a2_cento_basket',
  sas: 'ita_a2_sardegna_d',
  for_bo: 'ita_a2_forte_bologna',
  cas: 'ita_a2_caserta_bk',
  cre: 'ita_a2_cremona_juve',
  liv: 'ita_a2_livorno_bk',
  bri: 'ita_a2_stella_brindisi',
  forli: 'ita_a2_forli_f',
  mon: 'ita_a2_montecatini_bk',
  vig: 'ita_a2_vigevano_bk',
  pis: 'ita_a2_pistoia_p',
  rim: 'ita_a2_rimini_basket',
  rie: 'ita_a2_rieti_bk',
  ruv: 'ita_a2_puglia_bk',
  civ: 'ita_a2_friuli_basket',
  ura: 'ita_a2_wildcat_milano',
  pes: 'ita_a2_pesaro_basket',
};

const A2_TEAM_NAME_ALIASES: Record<string, string> = {
  'basket avellino': 'ita_a2_basket_avellino',
  'avellino basket': 'ita_a2_basket_avellino',
  'm mestre': 'ita_a2_m_mestre',
  'basket mestre': 'ita_a2_m_mestre',
  'torino t': 'ita_a2_torino_t',
  'basket torino': 'ita_a2_torino_t',
  'cento basket': 'ita_a2_cento_basket',
  'benedetto xiv cento': 'ita_a2_cento_basket',
  'sardegna d': 'ita_a2_sardegna_d',
  'dinamo sassari': 'ita_a2_sardegna_d',
  'forte bologna': 'ita_a2_forte_bologna',
  'fortitudo bologna': 'ita_a2_forte_bologna',
  'caserta bk': 'ita_a2_caserta_bk',
  'juvecaserta 2021': 'ita_a2_caserta_bk',
  'cremona juve': 'ita_a2_cremona_juve',
  'juvi cremona 1952': 'ita_a2_cremona_juve',
  'livorno bk': 'ita_a2_livorno_bk',
  'libertas livorno 1947': 'ita_a2_livorno_bk',
  'stella brindisi': 'ita_a2_stella_brindisi',
  'new basket brindisi': 'ita_a2_stella_brindisi',
  'forlì f': 'ita_a2_forli_f',
  'forli f': 'ita_a2_forli_f',
  'pallacanestro forlì 2.015': 'ita_a2_forli_f',
  'montecatini bk': 'ita_a2_montecatini_bk',
  'pallacanestro montecatini': 'ita_a2_montecatini_bk',
  'vigevano bk': 'ita_a2_vigevano_bk',
  'pallacanestro vigevano': 'ita_a2_vigevano_bk',
  'pistoia p': 'ita_a2_pistoia_p',
  'pistoia basket 2000': 'ita_a2_pistoia_p',
  'rimini basket': 'ita_a2_rimini_basket',
  'rinascita basket rimini': 'ita_a2_rimini_basket',
  'rieti bk': 'ita_a2_rieti_bk',
  'rsr sebastiani rieti': 'ita_a2_rieti_bk',
  'puglia bk': 'ita_a2_puglia_bk',
  'ruvo di puglia': 'ita_a2_puglia_bk',
  'friuli basket': 'ita_a2_friuli_basket',
  'ueb cividale': 'ita_a2_friuli_basket',
  'wildcat milano': 'ita_a2_wildcat_milano',
  'urania milano': 'ita_a2_wildcat_milano',
  'pesaro basket': 'ita_a2_pesaro_basket',
  'v.l. pesaro': 'ita_a2_pesaro_basket',
};

const JERSEY_POOL = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 44, 55,
];

const COUNTRY_TO_NATIONALITY: Record<string, Nationality> = {
  italia: 'ITA',
  usa: 'USA',
  canada: 'USA',
  'regno unito': 'USA',
  'sudan del sud': 'USA',
  serbia: 'SRB',
  montenegro: 'SRB',
  'bosnia ed erzegovina': 'SRB',
  spagna: 'ESP',
  'repubblica dominicana': 'ESP',
  brasile: 'ESP',
  lituania: 'LTU',
  francia: 'FRA',
  mali: 'FRA',
  benin: 'FRA',
  "costa d'avorio": 'FRA',
  senegal: 'FRA',
  camerun: 'FRA',
  nigeria: 'FRA',
  germania: 'GER',
  argentina: 'ARG',
  grecia: 'GRE',
  slovenia: 'SLO',
  croazia: 'CRO',
  moldavia: 'CRO',
  lettonia: 'LAT',
  estonia: 'LAT',
};

function parseA2Position(rawPos: string): { primaryPosition: Position; secondaryPosition?: Position } {
  const parts = rawPos
    .trim()
    .toUpperCase()
    .split('/')
    .map((p) => p.trim() as Position);
  const primaryPosition = parts[0] || 'SF';
  const secondaryPosition = parts[1] && parts[1] !== primaryPosition ? parts[1] : undefined;
  return { primaryPosition, secondaryPosition };
}

function parseA2Nationality(rawNat: string, isItalianFormation: boolean): Nationality {
  const segments = rawNat
    .trim()
    .toLowerCase()
    .split('/')
    .map((s) => s.trim());

  if (segments[0] === 'italia') return 'ITA';

  for (const seg of segments) {
    const mapped = COUNTRY_TO_NATIONALITY[seg];
    if (mapped && mapped !== 'ITA') return mapped;
  }

  return isItalianFormation ? 'ITA' : 'USA';
}

function buildA2RealRosters(): Record<string, CustomPlayerTemplate[]> {
  const teamTemplateById = new Map(ALL_TEAM_TEMPLATES.map((t) => [t.id, t]));
  const grouped = new Map<
    string,
    Array<{
      firstName: string;
      lastName: string;
      primaryPosition: Position;
      secondaryPosition?: Position;
      nationality: Nationality;
      isItalianFormation: boolean;
      jerseyNumber?: number;
      overall?: number;
      birthDate?: string;
    }>
  >();

  const lines = RAW_A2_PLAYERS_CSV.trim().split(/\r?\n/);
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
      A2_SHORT_ID_MAP[shortTeamId] ?? A2_TEAM_NAME_ALIASES[teamName.toLowerCase()];
    if (!teamId) continue;

    const { primaryPosition, secondaryPosition } = parseA2Position(rawPos);
    const isItalianFormation = rawItaForm === 'true' || rawItaForm === '1' || rawItaForm === 'si';
    const nationality = parseA2Nationality(rawNat, isItalianFormation);
    const jerseyNum = rawJersey ? Number(rawJersey) : undefined;
    const overall = rawOvr ? Number(rawOvr) : undefined;
    const birthDate = parseBirthDateToItalian(rawBirthDate);

    const list = grouped.get(teamId) ?? [];
    list.push({
      firstName,
      lastName,
      primaryPosition,
      secondaryPosition,
      nationality,
      isItalianFormation,
      jerseyNumber: Number.isFinite(jerseyNum) ? jerseyNum : undefined,
      overall: Number.isFinite(overall) ? overall : undefined,
      birthDate,
    });
    grouped.set(teamId, list);
  }

  const refDate = getSeasonAgeReferenceDate(2026);
  const result: Record<string, CustomPlayerTemplate[]> = {};
  for (const [teamId, players] of grouped.entries()) {
    const tpl = teamTemplateById.get(teamId);
    const baseOvr = tpl ? tpl.avgOverall : 63;

    result[teamId] = players.map((p, idx) => {
      let ovrOffset: number;
      if (idx < 5) {
        ovrOffset = 4 - Math.floor(idx / 2);
      } else if (idx < 10) {
        ovrOffset = 1 - (idx - 5);
      } else {
        ovrOffset = -4 - Math.min(3, idx - 10);
      }

      const age = p.birthDate ? computeAgeFromBirthDate(p.birthDate, refDate) : undefined;

      return {
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber ?? JERSEY_POOL[idx % JERSEY_POOL.length],
        primaryPosition: p.primaryPosition,
        secondaryPosition: p.secondaryPosition,
        age,
        birthDate: p.birthDate,
        nationality: p.nationality,
        isItalianFormation: p.isItalianFormation,
        overall: p.overall ?? Math.max(50, Math.min(82, baseOvr + ovrOffset)),
      };
    });
  }

  return result;
}

export const A2_REAL_ROSTERS: Record<string, CustomPlayerTemplate[]> = buildA2RealRosters();

export const A2_REAL_BIRTHDATES_BY_NAME: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const roster of Object.values(A2_REAL_ROSTERS)) {
    for (const p of roster) {
      if (p.birthDate) {
        map[`${p.firstName} ${p.lastName}`.trim().toLowerCase()] = p.birthDate;
      }
    }
  }
  return map;
})();
