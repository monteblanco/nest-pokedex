import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { PokeResponse } from './interfaces/poke-response.interface';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    // Para no depender de un paquete de terceros se crea un adaptador que envuelva Axios
    // private readonly axios: AxiosInstance = axios;
    private readonly http: AxiosAdapter,
  ) {}

  async executeSeed() {
    await this.pokemonModel.deleteMany({}); // Limpia la tabla. delete * from pokemons

    const data = await this.http.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=650',
    );

    // Opción 1: Para optimizar inserción y no tener un await por cada inserción una opción es crear un arreglo de promesas y luego insertarlas todas.
    // const insertPromisesArray = [];

    // Opción 2:
    const pokemonToInsert: { name: string; no: number }[] = [];

    data.results.forEach(async ({ name, url }) => {
      const segments = url.split('/');
      const no: number = +segments[segments.length - 2];

      // const pokemon = await this.pokemonModel.create({ name, no }); // Optimizar y no hacer un await por cada inserción.

      // Opción 1: Poblar un arreglo con promesas
      // insertPromisesArray.push(this.pokemonModel.create({ name, no }));

      // Opción 2:
      pokemonToInsert.push({ name, no });
    });

    // Opción 1: Insertar arreglo de promesas
    // await Promise.all(insertPromisesArray);

    // Opción 2: Insertar arreglo en base de datos
    await this.pokemonModel.insertMany(pokemonToInsert);

    return 'Seed executed';
  }
}
