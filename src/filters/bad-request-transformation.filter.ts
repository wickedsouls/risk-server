import { BadRequestException, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(BadRequestException)
export class BadRequestTransformationFilter extends BaseWsExceptionFilter {
  catch(exception: BadRequestException, host: any) {
    const { message } = exception.getResponse() as { message: string };
    const properException = new WsException({
      status: 'bad request',
      message,
    });
    super.catch(properException, host);
  }
}
