import { getFeed } from '../src/services/feed.service';
import {
  buildFeedScenario,
} from '../src/test-utils/factories';
import { applyTestDatabaseHooks } from './test-db';

describe('getFeed', () => {
  applyTestDatabaseHooks();

  it('deve retornar itens reais persistidos no banco para truth, dare e club', async () => {
    const scenario = await buildFeedScenario();

    const feed = await getFeed(scenario.users.owner.id);

    expect(Array.isArray(feed)).toBe(true);
    expect(feed.length).toBe(7);

    const truthItems = feed.filter((item) => item.type === 'truth');
    const dareItems = feed.filter((item) => item.type === 'dare');
    const clubItems = feed.filter((item) => item.type === 'club');

    expect(truthItems).toHaveLength(2);
    expect(dareItems).toHaveLength(2);
    expect(clubItems).toHaveLength(3);

    expect(
      truthItems.some(
        (item) =>
          item.type === 'truth' &&
          item.title ===
            'Qual foi a mentira mais deslavada que você já contou para os seus pais?',
      ),
    ).toBe(true);

    expect(
      dareItems.some(
        (item) =>
          item.type === 'dare' &&
          item.challenger === 'Pedro Roberto' &&
          item.title ===
            'Ligue para um amigo e fale com sotaque por pelo menos 30 segundos.',
      ),
    ).toBe(true);

    expect(
      clubItems.some(
        (item) =>
          item.type === 'club' &&
          item.clubName === 'Clube dos Corajosos' &&
          item.badge === 'Desafio' &&
          item.quote ===
            'Poste uma selfie fazendo a careta mais estranha que conseguir.',
      ),
    ).toBe(true);
  });

  it('deve retornar feed vazio quando não houver dados persistidos', async () => {
    const feed = await getFeed();

    expect(feed).toEqual([]);
  });

  it('deve preencher o contrato esperado pelo mobile para cada tipo de item', async () => {
    const scenario = await buildFeedScenario();

    const feed = await getFeed(scenario.users.owner.id);

    const truthItem = feed.find((item) => item.type === 'truth');
    const dareItem = feed.find((item) => item.type === 'dare');
    const clubItem = feed.find((item) => item.type === 'club');

    expect(truthItem).toBeDefined();
    expect(dareItem).toBeDefined();
    expect(clubItem).toBeDefined();

    expect(truthItem).toMatchObject({
      id: expect.any(String),
      type: 'truth',
      title: expect.any(String),
      time: expect.any(String),
      likes: expect.any(Number),
      comments: expect.any(Number),
      participants: expect.any(Array),
      extraCount: expect.any(Number),
    });

    expect(dareItem).toMatchObject({
      id: expect.any(String),
      type: 'dare',
      challenger: expect.any(String),
      title: expect.any(String),
      attemptsLabel: expect.any(String),
      expiresIn: expect.any(String),
      progress: expect.any(Number),
    });

    expect(clubItem).toMatchObject({
      id: expect.any(String),
      type: 'club',
      clubName: expect.any(String),
      badge: expect.stringMatching(/^(Verdade|Desafio)$/),
      quote: expect.any(String),
      answersCount: expect.any(Number),
    });
  });

  it('deve retornar labels coerentes para dare com expiração e tentativas', async () => {
    const scenario = await buildFeedScenario();

    const feed = await getFeed(scenario.users.owner.id);

    const dareItem = feed.find(
      (item) =>
        item.type === 'dare' &&
        item.title ===
          'Envie um áudio cantando o refrão da última música que você ouviu hoje.',
    );

    expect(dareItem).toBeDefined();

    if (!dareItem || dareItem.type !== 'dare') {
      throw new Error('Dare item esperado não encontrado no feed');
    }

    expect(dareItem.attemptsLabel).toBe('Tentativas: 0/8');
    expect(dareItem.expiresIn.length).toBeGreaterThan(0);
    expect(dareItem.progress).toBe(0);
  });
});