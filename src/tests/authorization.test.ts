import {expect,it} from 'vitest';import {mayAccessParent,mayAccessStudent} from '../lib/authorization';
it('denies cross-child access and unlinked parents',()=>{expect(mayAccessStudent({userId:'p',role:'STUDENT',studentId:'a'},'b',true)).toBe(false);expect(mayAccessStudent({userId:'p',role:'PARENT'},'a',false)).toBe(false);expect(mayAccessStudent({userId:'p',role:'PARENT'},'a',true)).toBe(true);});
it('child mode cannot access parent dashboard',()=>expect(mayAccessParent({userId:'p',role:'STUDENT',studentId:'a'})).toBe(false));
