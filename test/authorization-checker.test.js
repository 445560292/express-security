const assert=require('assert');
const AuthorizationChecker=require('../lib/authorization-checker');



describe('测试 AuthorizationChecker类',()=>{

    // 模拟 req、res、next
    // 第一组：
    let req={ session:{ username:'', roles:[]} };
    let res={ send:()=>{ } };
    let next=()=>{};

    describe('.requireLogin()',()=>{

        const test=(checker)=>{
                let executed=false;
                checker.requireLogin()(req,res,()=>{
                    executed=true;
                });
                return executed;
        };
        
        describe("当username=假 时:\t资源不可访问(跳过next()方法)",function(){

            it('测试以默认参数进行初始化的情况',()=>{
                const checker=new AuthorizationChecker();
                ["",undefined,null].forEach(e=>{
                    req.session.username=e;
                    const executed=test(checker);
                    assert.ok(!executed,'username=假，next()方法不应该被执行');
                });
            });
            
            it('测试自定义配置的请况',()=>{
                ["",undefined,null].forEach(e=>{
                    req.session.user=e;
                    const checker=new AuthorizationChecker(
                        (req)=>{return !! req.session.user;}
                    );
                    const executed=test(checker);
                    assert.ok(!executed,'username=假，next()方法不应该被执行');
                });
            });
        });

        describe('username=普通字符串 时:\t资源可以访问(执行next()方法)',()=>{

            it("测试以默认参数进行初始化的情况",function(){
                const checker=new AuthorizationChecker();
                req.session.username="hello";
                const executed=test(checker);
                //期待executed为true
                assert.ok(executed,'普通字符串的用户名，理应执行next()');
            });

            it('测试自定义配置的请况', () => {
                [" ", 0x00af, "\x00ab","admin",].forEach(e => {
                    req.session.user = e;
                    const checker = new AuthorizationChecker(
                        (req) => { return !!req.session.user; }
                    );
                    const executed=test(checker);
                    assert.ok(executed,'普通字符串的用户名，理应执行next()');
                });
            });
            
        });
        
    });
    

    describe('.requireRole()',()=>{
        const test = function (checker, ROLE) {
            var executed = false;
            checker.requireRole(ROLE)(req, res, () => {
                executed = true;
            });
            return executed;
        };

        describe("要求`ROLE_1`，已有`ROLE_X`",()=>{

            it("测试使用默认参数进行初始化的情况",function(){
                let checker=new AuthorizationChecker();
                req.session.roles=['ROLE_X'];
                const executed=test(checker,"ROLE_1");
                assert.ok(!executed, "没有要求的角色，但next()被执行了");
            });
            it("测试使用自定义参数进行初始化的情况",function(){
                let checker=new AuthorizationChecker(
                    (req)=>{return !! req.session.username;},
                    (req)=>{return req.session.rolelist;}
                );
                req.session.rolelist=['ROLE_X'];
                const executed=test(checker,"ROLE_1");
                assert.ok(!executed, "没有要求的角色，但next()被执行了");
            });
            
        });


        describe("要求`ROLE_A`，已有`ROLE_A`",()=>{

            it("测试使用默认参数进行初始化的情况",function(){
                let checker=new AuthorizationChecker();
                req.session.roles=['ROLE_A'];
                const executed=test(checker,"ROLE_A");
                assert.ok(executed,"拥有所要求的角色`ROLE_A`，但next()未执行");
            });

            it("测试使用自定义参数进行初始化的情况",function(){
                let checker=new AuthorizationChecker(
                    (req)=>{return !! req.session.username;},
                    (req)=>{return req.session.rolelist;}
                );
                req.session.rolelist=['ROLE_A'];
                const executed=test(checker,"ROLE_A");
                assert.ok(executed,"拥有所要求的角色`ROLE_A`，但next()未执行");
            });
            
        });

    });
    

    describe('.requireAnyRole()',()=>{

        const test=(checker,ROLE_ARRAY)=>{
            let executed=false; 
            checker.requireAnyRole(ROLE_ARRAY)(req,res,()=>{
                executed=true;
            });
            return executed;
        };

        describe('要求 [ROLE_X,ROLE_Y] 之中的任一角色，已有 `ROLE_1,ROLE_2,ROLE_X`',()=>{

            it('测试使用默认参数进行初始化的情况', () => {
                req.session.roles = ['ROLE_1', 'ROLE_2', 'ROLE_X'];
                const checker=new AuthorizationChecker();
                const executed = test(checker,['ROLE_X','ROLE_Y']);
                assert.ok(executed, "拥有指定角色，next()理应被执行");
            });

            it('测试使用自定义参数进行初始化的情况', () => {
                req.session.rolelist = ['ROLE_1', 'ROLE_2', 'ROLE_X'];
                const checker=new AuthorizationChecker(
                    (req)=>{return !!req.session.username;},
                    (req)=>{return req.session.rolelist;}
                );
                const executed = test(checker,['ROLE_X','ROLE_Y']);
                assert.ok(executed, "拥有指定角色，next()理应被执行");
            });
        });
  
        describe('要求 [ROLE_X,ROLE_Y] 之中的任一角色，已有 `ROLE_1,ROLE_2,ROLE_3`', () => {

            it('测试使用默认参数进行初始化的情况', () => {
                req.session.roles = ['ROLE_1', 'ROLE_2', 'ROLE_3'];
                const checker = new AuthorizationChecker();
                const executed = test(checker, ['ROLE_X', 'ROLE_Y']);
                assert.ok(!executed, "无指定的任一角色，绝不应该执行next()");
            });

            it('测试使用自定义参数进行初始化的情况', () => {
                req.session.rolelist = ['ROLE_1', 'ROLE_2', 'ROLE_3'];
                const checker = new AuthorizationChecker(
                    (req) => { return !!req.session.username; },
                    (req) => { return req.session.rolelist; }
                );
                const executed = test(checker, ['ROLE_X', 'ROLE_Y']);
                assert.ok(!executed, "无指定的任一角色，绝不应该执行next()");
            });
        });
 
    });

    describe('.requireAllRole()',()=>{

        const test=(checker,ROLE_ARRAY)=>{
            let executed=false; 
            checker.requireAllRoles(ROLE_ARRAY)(req,res,()=>{
                executed=true;
            });
            return executed;
        };

        describe('要求 [ROLE_X,ROLE_Y] 的全部角色，已有 `ROLE_1,ROLE_2,ROLE_3,ROLE_X`',()=>{

            it('测试使用默认参数进行初始化的情况', () => {
                req.session.roles = ['ROLE_1', 'ROLE_2','ROLE_3', 'ROLE_X'];
                const checker=new AuthorizationChecker();
                const executed = test(checker,['ROLE_X','ROLE_Y']);
                assert.ok(!executed, "未拥有指定的全部角色，next()不应被执行");
            });

            it('测试使用自定义参数进行初始化的情况', () => {
                req.session.rolelist = ['ROLE_1', 'ROLE_2','ROLE_3', 'ROLE_X'];
                const checker=new AuthorizationChecker(
                    (req)=>{return !!req.session.username;},
                    (req)=>{return req.session.rolelist;}
                );
                const executed = test(checker,['ROLE_X','ROLE_Y']);
                assert.ok(!executed, "未拥有指定的全部角色，next()不应被执行");
            });
        });
  
        describe('要求 [ROLE_X,ROLE_Y] 的全部角色，已有`ROLE_1,ROLE_Y,ROLE_X``', () => {

            it('测试使用默认参数进行初始化的情况', () => {
                req.session.roles = ['ROLE_1', 'ROLE_Y','ROLE_X',];
                const checker = new AuthorizationChecker();
                const executed = test(checker, ['ROLE_X', 'ROLE_Y']);
                assert.ok(executed, "拥有要求的全部角色，理应应该执行next()");
            });

            it('测试使用自定义参数进行初始化的情况', () => {
                req.session.rolelist = ['ROLE_1', 'ROLE_Y','ROLE_X',];
                const checker = new AuthorizationChecker(
                    (req) => { return !!req.session.username; },
                    (req) => { return req.session.rolelist; }
                );
                const executed = test(checker, ['ROLE_X', 'ROLE_Y']);
                assert.ok(executed, "拥有要求的全部角色，理应应该执行next()");
            });
        });
 
    });


});