import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { playerStub } from '../../test/stubs/game.stub';

describe('ChatService', () => {
  let service: ChatService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should create chat room', () => {
    service.createChatRoom('game1');
    expect(service['chat']['game1']).toMatchObject([]);
  });
  it('should set message', () => {
    service.setMessage('hello', 'game1', playerStub());
    expect(service['chat']['game1'][0]).toBeDefined();
    expect(service['chat']['game1'][0]).toHaveProperty('message');
    expect(service['chat']['game1'][0].message).toBe('hello');
  });
});
